// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Ecommerce} from "../src/Ecommerce.sol";

interface IERC20Mint {
    function mint(address to, uint256 amount) external;
}

contract SeedEcommerceScript is Script {
    // Anvil well-known accounts
    address constant ACCOUNT_0 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // deployer / customer
    address constant ACCOUNT_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // company 1 owner
    address constant ACCOUNT_2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // company 2 owner

    uint256 constant PK_0 = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant PK_1 = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 constant PK_2 = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;

    // 1 EURT = 1_000_000 (6 decimals)
    uint256 constant EURT = 1_000_000;

    function run() external {
        address euroToken = vm.envAddress("EURO_TOKEN_ADDRESS");
        address ecommerce = vm.envAddress("ECOMMERCE_ADDRESS");

        Ecommerce ec = Ecommerce(ecommerce);
        IERC20Mint token = IERC20Mint(euroToken);

        // ── 1. Mint EURT to company wallets ──────────
        vm.startBroadcast(PK_0);
        token.mint(ACCOUNT_1, 10 * EURT);  // 10 EURT — company 1 owner (gas)
        token.mint(ACCOUNT_2, 10 * EURT);  // 10 EURT — company 2 owner (gas)
        vm.stopBroadcast();

        console.log("Minted EURT: account[1]=10, account[2]=10");

        // ── 2. Register companies with distinct addresses ──────────────────────
        vm.startBroadcast(PK_0); // owner calls registerCompanyByAdmin
        ec.registerCompanyByAdmin(
            ACCOUNT_1,
            "BioGenetica Avanzada",
            "Investigacion y desarrollo de semillas resistentes a sequias"
        );
        ec.registerCompanyByAdmin(
            ACCOUNT_2,
            "TechVision Electronics",
            "Dispositivos electronicos y domotica de alta gama"
        );
        vm.stopBroadcast();

        console.log("Registered: company[1]=ACCOUNT_1, company[2]=ACCOUNT_2");

        // ── 3. Add products — company 1 (account[1]) ─────────────────────────
        vm.startBroadcast(PK_1);
        ec.addProduct("Home Security Camera",  "Camara IP 4K con vision nocturna",        33_270_000, 50);
        ec.addProduct("Smart Light Bulb",      "Bombilla LED regulable compatible con app", 12_500_000, 100);
        ec.addProduct("Wireless Charger Pad",  "Carga rapida 15W para Qi",                18_990_000, 75);
        vm.stopBroadcast();

        console.log("Added 3 products to company[1]");

        // ── 4. Add products — company 2 (account[2]) ─────────────────────────
        vm.startBroadcast(PK_2);
        ec.addProduct("Bluetooth Speaker",   "Altavoz 360 grados con 20h de bateria",        45_000_000, 30);
        ec.addProduct("Mechanical Keyboard", "Teclado mecanico RGB con switches tactiles",    89_990_000, 20);
        vm.stopBroadcast();

        console.log("Added 2 products to company[2]");
        console.log("Seed complete.");
    }
}
