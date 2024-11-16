import "hardhat/types/config";
import "hardhat/types/runtime";

import { Pint } from "./Pint";
declare module "hardhat/types/config" {}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    pint: Pint;
  }
}
