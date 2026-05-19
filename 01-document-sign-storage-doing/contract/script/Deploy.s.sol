// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";

/// @title Script de despliegue para DocumentRegistry
/// @notice Soporta Anvil (local) y testnets via Alchemy.
///
/// @dev Uso:
///   Anvil  → forge script script/Deploy.s.sol --rpc-url anvil --broadcast
///   Sepolia → forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("  DocumentRegistry - Deploy");
        console.log("========================================");
        console.log("Red      :", block.chainid);
        console.log("Deployer :", deployer);
        console.log("Balance  :", deployer.balance);
        console.log("----------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        DocumentRegistry registry = new DocumentRegistry();

        vm.stopBroadcast();

        console.log("DocumentRegistry:", address(registry));
        console.log("========================================");
    }
}
