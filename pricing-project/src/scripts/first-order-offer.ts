require("dotenv").config();

import {
  CustomerGroupService,
  CustomerService,
  OrderService,
} from "@medusajs/medusa";
import loaders from "@medusajs/medusa/dist/loaders";
import express from "express";

const firstOrderCustomerGroupId = "cgrp_01HGB4ZHVN6VS4NQWA6PP3DJ0K";

async function main({ directory }) {
  const app = express();
  const { container } = await loaders({
    directory,
    expressApp: app,
    isTest: false,
  });

  const orderService: OrderService = container.resolve("orderService");
  const customerService: CustomerService = container.resolve("customerService");
  const customerGroupsService: CustomerGroupService = container.resolve(
    "customerGroupService"
  );

  const order = await orderService.retrieve("order_01HGBBZ0NCVG9AV68RTGWD5027");
  const {
    id: customerId,
    groups = [],
    orders = [],
  } = await customerService.retrieve(order.customer_id, {
    relations: ["groups", "orders"],
  });

  if (groups.map((g) => g.id).indexOf(firstOrderCustomerGroupId) > -1) {
    console.log("orders - ", JSON.stringify(orders, null, 2));

    console.log("returning early");

    return;
  }

  await customerGroupsService.addCustomers(firstOrderCustomerGroupId, [
    customerId,
  ]);
}

main({ directory: process.cwd() });
