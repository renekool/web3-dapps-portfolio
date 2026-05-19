// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Ecommerce} from "../src/Ecommerce.sol";

contract DeployEcommerceScript is Script {
    function run() external returns (Ecommerce) {
        address euroTokenAddress = vm.envAddress("EURO_TOKEN_ADDRESS");

        vm.startBroadcast();

        Ecommerce ecommerce = new Ecommerce(euroTokenAddress);

        console.log("Ecommerce deployed at:", address(ecommerce));
        console.log("Owner:", ecommerce.owner());
        console.log("EuroToken:", ecommerce.euroTokenAddress());

        vm.stopBroadcast();

        return ecommerce;
    }
}
