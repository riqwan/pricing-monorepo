import { OrderService } from "@medusajs/medusa";
import { IEventBusService } from "@medusajs/types";
import { EntityManager } from "typeorm";

type OrderPlacedData = {
  id: string;
};

export default class FirstOrderOfferSubscriber {
  protected readonly manager_: EntityManager;
  protected readonly orderService_: OrderService;

  constructor({
    manager,
    eventBusService,
    orderService,
  }: {
    manager: EntityManager;
    eventBusService: IEventBusService;
    orderService: OrderService;
  }) {
    this.manager_ = manager;
    this.orderService_ = orderService;

    eventBusService.subscribe(
      OrderService.Events.PLACED,
      this.handleFirstOrderOffer
    );
  }

  // { id: 'order_01HGB8AR2ATYR45FFQQ8DVF2T0', no_notification: null }
  handleFirstOrderOffer = async (data: OrderPlacedData): Promise<any> => {
    console.log("data - ", data);
    const order = this.orderService_.retrieve(data.id);

    console.log("order ----- ", order);

    return true;
  };
}
