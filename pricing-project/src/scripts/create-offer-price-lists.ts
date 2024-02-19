require("dotenv").config();

import loaders from "@medusajs/medusa/dist/loaders";
import { CustomerGroupService } from "@medusajs/medusa/dist/services";
import { MedusaApp, Modules } from "@medusajs/modules-sdk";
import { PricingModuleService } from "@medusajs/pricing";
import { PriceListPriceDTO, PriceSetDTO } from "@medusajs/types";
import { remoteQueryObjectFromString } from "@medusajs/utils";
import express from "express";

async function initializeModules() {
  return await MedusaApp({
    modulesConfig: {
      [Modules.PRODUCT]: true,
      [Modules.PRICING]: true,
    },
    sharedResourcesConfig: {
      database: { clientUrl: process.env.POSTGRES_URL },
    },
    injectedDependencies: {},
  });
}

async function fetchVariantPriceSets(query) {
  const fields = [
    "id",
    "price.id",
    "price.price_set.price_set_money_amounts.money_amount.id",
    "price.price_set.price_set_money_amounts.money_amount.amount",
    "price.price_set.price_set_money_amounts.money_amount.currency_code",
    "price.price_set.price_set_money_amounts.money_amount.min_quantity",
    "price.price_set.price_set_money_amounts.money_amount.max_quantity",
    "price.price_set.price_set_money_amounts.price_rules.value",
    "price.price_set.price_set_money_amounts.price_rules.rule_type.rule_attribute",
  ];

  const remoteQueryObject = remoteQueryObjectFromString({
    entryPoint: "variant",
    variables: {},
    fields,
  });
  console.log("remoteQueryObject - ", remoteQueryObject);
  return await query(remoteQueryObject);
}

async function cleanupData(pricingService) {
  const existingPriceLists = (await pricingService.listPriceLists({})).filter(
    (pl) => pl.title === "New customer price list"
  );

  const listPriceListRules = await pricingService.listPriceListRules({
    price_list_id: existingPriceLists.map((pl) => pl.id),
  });

  await pricingService.deletePriceListRules(
    listPriceListRules.map((plr) => plr.id)
  );
  await pricingService.deletePriceLists(existingPriceLists.map((pl) => pl.id));
}

async function createPriceLists(pricingService, variants, customerGroup) {
  const pricesToCreate: PriceListPriceDTO[] = [];

  for (const variant of variants) {
    const priceSet: PriceSetDTO | undefined = variant?.price?.price_set;
    const priceSetMoneyAmounts =
      variant?.price?.price_set?.price_set_money_amounts || [];

    if (!priceSet) continue;

    for (const priceSetMoneyAmount of priceSetMoneyAmounts) {
      const modulePriceRules: Record<string, string> = {};
      const { money_amount: moneyAmount, price_rules: priceRules = [] } =
        priceSetMoneyAmount;

      priceRules.forEach((pr) => {
        const ruleAttribute = pr?.rule_type?.rule_attribute;

        if (ruleAttribute) {
          modulePriceRules[ruleAttribute] = pr.value;
        }
      });

      pricesToCreate.push({
        price_set_id: priceSet.id,
        currency_code: moneyAmount.currency_code,
        amount: moneyAmount.amount / 10,
        min_quantity: moneyAmount.min_quantity,
        max_quantity: moneyAmount.max_quantity,
        rules: modulePriceRules,
      });
    }
  }

  await pricingService.createPriceLists([
    {
      title: "New customer price list",
      description: "New customer price list",
      status: "active",
      rules: {
        customer_group_id: [customerGroup.id],
      },
      prices: pricesToCreate,
    },
  ]);
}

async function main({ directory }) {
  const app = express();
  const { container } = await loaders({
    directory,
    expressApp: app,
    isTest: false,
  });

  const customerGroupService: CustomerGroupService = container.resolve(
    "customerGroupService"
  );

  let [customerGroup] = await customerGroupService.list(
    {
      name: "First Customer Group",
    },
    {}
  );

  if (!customerGroup) {
    customerGroup = await customerGroupService.create({
      name: "First Customer Group",
    });
  }

  const { query, modules } = await initializeModules();
  const pricingService = modules[
    Modules.PRICING
  ] as unknown as PricingModuleService;

  await cleanupData(pricingService);

  const variants = await fetchVariantPriceSets(query);

  await createPriceLists(pricingService, variants, customerGroup);
}

main({ directory: process.cwd() });
