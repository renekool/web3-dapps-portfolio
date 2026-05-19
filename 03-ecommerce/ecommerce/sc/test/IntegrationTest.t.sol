// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/libraries/InvoiceLib.sol";
import "../src/libraries/CartLib.sol";
import "./mocks/MockEuroToken.sol";

contract IntegrationTest is Test {
    Ecommerce ecommerce;
    MockEuroToken mockToken;

    address owner;
    address companyAddr;
    address customerAddr;

    function setUp() public {
        owner = makeAddr("owner");
        companyAddr = makeAddr("company1");
        customerAddr = makeAddr("customer1");

        vm.startPrank(owner);
        mockToken = new MockEuroToken();
        ecommerce = new Ecommerce(address(mockToken));
        vm.stopPrank();

        // Mint enough tokens to customer
        mockToken.mint(customerAddr, 10_000);
    }

    // ── Full commercial cycle ─────────────────────────────────────────────────

    function test_fullCycle_happyPath() public {
        // 1. Company registers itself
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        // 2. Company adds product
        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 500, 20);
        uint256 productId = 1;

        // 3. Customer approves EuroToken allowance
        vm.prank(customerAddr);
        mockToken.approve(address(ecommerce), 1000);

        // 4. Customer adds to cart (auto-registers customer)
        vm.prank(customerAddr);
        ecommerce.addToCart(productId, 2); // 500 * 2 = 1000
        assertTrue(ecommerce.isCustomerRegistered(customerAddr));

        // 5. Customer creates invoice — stock decremented, cart cleared
        vm.prank(customerAddr);
        uint256 invoiceId = ecommerce.createInvoice(1);

        InvoiceLib.Invoice memory inv = ecommerce.getInvoice(invoiceId);
        assertEq(inv.totalAmount, 1000);
        assertFalse(inv.isPaid);
        assertEq(ecommerce.getProduct(productId).stock, 18); // 20 - 2
        assertEq(ecommerce.getCart(customerAddr).length, 0);

        // 6. Customer processes payment — isPaid == true, tokens transferred to company
        vm.prank(customerAddr);
        ecommerce.processPayment(invoiceId);

        assertTrue(ecommerce.getInvoice(invoiceId).isPaid);
        assertEq(mockToken.balanceOf(companyAddr), 1000);
        assertEq(mockToken.balanceOf(customerAddr), 9000); // 10000 - 1000
    }

    function test_doublePayment_reverts() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 10);

        vm.prank(customerAddr);
        mockToken.approve(address(ecommerce), 200);

        vm.prank(customerAddr);
        ecommerce.addToCart(1, 1);

        vm.prank(customerAddr);
        uint256 invoiceId = ecommerce.createInvoice(1);

        vm.prank(customerAddr);
        ecommerce.processPayment(invoiceId);

        // Mint more and try again
        mockToken.mint(customerAddr, 100);
        vm.prank(customerAddr);
        mockToken.approve(address(ecommerce), 100);

        vm.prank(customerAddr);
        vm.expectRevert("Already paid");
        ecommerce.processPayment(invoiceId);
    }

    function test_insufficientStock_at_createInvoice() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 2); // only 2 in stock

        address customer2 = makeAddr("customer2");
        mockToken.mint(customer2, 1000);

        // customerAddr adds to cart first (stock still = 2)
        vm.prank(customerAddr);
        ecommerce.addToCart(1, 1);

        // customer2 buys all stock via invoice — stock drops to 0
        vm.prank(customer2);
        ecommerce.addToCart(1, 2);
        vm.prank(customer2);
        ecommerce.createInvoice(1);

        // customerAddr's cart still has qty=1, but stock is now 0
        // createInvoice must re-validate stock → reverts
        vm.prank(customerAddr);
        vm.expectRevert("Insufficient stock");
        ecommerce.createInvoice(1);
    }

    function test_twoCustomers_independentInvoices() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 300, 20);

        address customer2 = makeAddr("customer2");
        mockToken.mint(customer2, 10_000);

        // Customer 1
        vm.prank(customerAddr);
        mockToken.approve(address(ecommerce), 300);
        vm.prank(customerAddr);
        ecommerce.addToCart(1, 1);
        vm.prank(customerAddr);
        uint256 inv1 = ecommerce.createInvoice(1);

        // Customer 2
        vm.prank(customer2);
        mockToken.approve(address(ecommerce), 600);
        vm.prank(customer2);
        ecommerce.addToCart(1, 2);
        vm.prank(customer2);
        uint256 inv2 = ecommerce.createInvoice(1);

        assertNotEq(inv1, inv2);
        assertEq(ecommerce.getInvoice(inv1).customerAddress, customerAddr);
        assertEq(ecommerce.getInvoice(inv2).customerAddress, customer2);

        vm.prank(customerAddr);
        ecommerce.processPayment(inv1);
        vm.prank(customer2);
        ecommerce.processPayment(inv2);

        assertTrue(ecommerce.getInvoice(inv1).isPaid);
        assertTrue(ecommerce.getInvoice(inv2).isPaid);
        assertEq(mockToken.balanceOf(companyAddr), 900); // 300 + 600
    }

    function test_multiProduct_cart_totalAmount_correct() public {
        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.startPrank(companyAddr);
        ecommerce.addProduct("Widget A", "Description", 100, 50);
        ecommerce.addProduct("Widget B", "Description", 250, 30);
        ecommerce.addProduct("Widget C", "Description", 75, 100);
        vm.stopPrank();

        // Cart: 3 A + 2 B + 4 C = 300 + 500 + 300 = 1100
        uint256 expectedTotal = 3 * 100 + 2 * 250 + 4 * 75;

        vm.prank(customerAddr);
        mockToken.approve(address(ecommerce), expectedTotal);

        vm.startPrank(customerAddr);
        ecommerce.addToCart(1, 3);
        ecommerce.addToCart(2, 2);
        ecommerce.addToCart(3, 4);
        uint256 invoiceId = ecommerce.createInvoice(1);
        vm.stopPrank();

        InvoiceLib.Invoice memory inv = ecommerce.getInvoice(invoiceId);
        assertEq(inv.totalAmount, expectedTotal);
        assertEq(inv.items.length, 3);

        vm.prank(customerAddr);
        ecommerce.processPayment(invoiceId);

        assertEq(mockToken.balanceOf(companyAddr), expectedTotal);
    }
}
