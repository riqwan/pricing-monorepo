import { AbstractBatchJobStrategy, BatchJobService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";

class MyImportStrategy extends AbstractBatchJobStrategy {
  static batchType = "product-import";

  protected batchJobService_: BatchJobService;
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager;

  processJob(batchJobId: string): Promise<void> {
    console.log("Method not implemented.");
    return;
  }

  buildTemplate(): Promise<string> {
    console.log("Method not implemented.");
    return;
  }
}

export default MyImportStrategy;
