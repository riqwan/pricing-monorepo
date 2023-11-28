import {
  CustomerGroupService,
  CustomerService,
  OrderService,
} from "@medusajs/medusa";
import { IEventBusService } from "@medusajs/types";
import { EntityManager } from "typeorm";

type OrderPlacedData = {
  id: string;
};

const firstOrderCustomerGroupId = "cgrp_01HGB4ZHVN6VS4NQWA6PP3DJ0K";

export default class FirstOrderOfferSubscriber {
  protected readonly manager_: EntityManager;
  protected readonly orderService_: OrderService;
  protected readonly customerService_: CustomerService;
  protected readonly customerGroupService_: CustomerGroupService;

  constructor({
    manager,
    eventBusService,
    orderService,
    customerService,
    customerGroupService,
  }: {
    manager: EntityManager;
    eventBusService: IEventBusService;
    orderService: OrderService;
    customerService: CustomerService;
    customerGroupService: CustomerGroupService;
  }) {
    this.manager_ = manager;
    this.orderService_ = orderService;
    this.customerService_ = customerService;
    this.customerGroupService_ = customerGroupService;

    eventBusService.subscribe(
      OrderService.Events.PLACED,
      this.handleFirstOrderOffer
    );
  }

  // { id: 'order_01HGB8AR2ATYR45FFQQ8DVF2T0', no_notification: null }
  handleFirstOrderOffer = async (data: OrderPlacedData): Promise<any> => {
    const order = await this.orderService_.retrieve(data.id);
    console.log("running handleFirstOrderOffer - ", order);
    const {
      id: customerId,
      groups = [],
      orders = [],
    } = await this.customerService_.retrieve(order.customer_id, {
      relations: ["groups", "orders"],
    });

    if (groups.map((g) => g.id).indexOf(firstOrderCustomerGroupId) > -1) {
      console.log("returning early");

      return;
    }

    await this.customerGroupService_.addCustomers(firstOrderCustomerGroupId, [
      customerId,
    ]);

    return true;
  };
}
