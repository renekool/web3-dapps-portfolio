// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EuroToken} from "../src/EuroToken.sol";

contract DeployEuroToken is Script {
    function run() external returns (EuroToken) {
        vm.startBroadcast();

        EuroToken token = new EuroToken();

        console.log("EuroToken deployed at:", address(token));
        console.log("Owner:", token.owner());
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Decimals:", token.decimals());
        console.log("MAX_SUPPLY:", token.MAX_SUPPLY());

        vm.stopBroadcast();

        return token;
    }
}
