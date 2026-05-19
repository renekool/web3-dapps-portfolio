// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/libraries/InvoiceLib.sol";
import "../src/libraries/ProductLib.sol";
import "../src/libraries/CartLib.sol";
import "./mocks/MockEuroToken.sol";

contract InvoiceTest is Test {
    Ecommerce ecommerce;
    MockEuroToken mockToken;

    address owner;
    address companyAddr;
    address customerAddr;

    uint256 constant PRODUCT_A = 1; // price=100, stock=50
    uint256 constant PRODUCT_B = 2; // price=200, stock=10

    function setUp() public {
        owner = makeAddr("owner");
        companyAddr = makeAddr("company1");
        customerAddr = makeAddr("customer1");

        vm.startPrank(owner);
        mockToken = new MockEuroToken();
        ecommerce = new Ecommerce(address(mockToken));
        vm.stopPrank();

        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        vm.startPrank(companyAddr);
        ecommerce.addProduct("Widget A", "Description", 100, 50);
        ecommerce.addProduct("Widget B", "Description", 200, 10);
        vm.stopPrank();

        // Populate cart
        vm.startPrank(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 2); // 100 * 2 = 200
        ecommerce.addToCart(PRODUCT_B, 1); // 200 * 1 = 200
        vm.stopPrank();
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    function test_createInvoice_success_fields() public {
        vm.prank(customerAddr);
        vm.expectEmit(true, true, true, true);
        emit Ecommerce.InvoiceCreated(1, customerAddr, 1, 400);
        uint256 invoiceId = ecommerce.createInvoice(1);

        assertEq(invoiceId, 1);

        InvoiceLib.Invoice memory inv = ecommerce.getInvoice(1);
        assertEq(inv.customerAddress, customerAddr);
        assertEq(inv.companyId, 1);
        assertEq(inv.totalAmount, 400);
        assertFalse(inv.isPaid);
        assertGt(inv.createdAt, 0);
        assertEq(inv.items.length, 2);
    }

    function test_createInvoice_invoiceItem_priceAtPurchase_snapshot() public {
        vm.prank(customerAddr);
        ecommerce.createInvoice(1);

        // Change price after invoice
        vm.prank(companyAddr);
        ecommerce.updateProduct(PRODUCT_A, "Widget A", "Description", 999, 50);

        InvoiceLib.Invoice memory inv = ecommerce.getInvoice(1);
        // priceAtPurchase must be the original price (100), not the new price (999)
        assertEq(inv.items[0].priceAtPurchase, 100);
    }

    function test_createInvoice_totalAmount_multipleItems() public {
        vm.prank(customerAddr);
        ecommerce.createInvoice(1);

        InvoiceLib.Invoice memory inv = ecommerce.getInvoice(1);
        // 100*2 + 200*1 = 400
        assertEq(inv.totalAmount, 400);
    }

    function test_createInvoice_decrements_stock() public {
        vm.prank(customerAddr);
        ecommerce.createInvoice(1);

        ProductLib.Product memory pA = ecommerce.getProduct(PRODUCT_A);
        ProductLib.Product memory pB = ecommerce.getProduct(PRODUCT_B);
        assertEq(pA.stock, 48); // 50 - 2
        assertEq(pB.stock, 9);  // 10 - 1
    }

    function test_createInvoice_clears_cart() public {
        vm.prank(customerAddr);
        ecommerce.createInvoice(1);

        CartLib.CartItem[] memory cart = ecommerce.getCart(customerAddr);
        assertEq(cart.length, 0);
    }

    function test_createInvoice_isPaid_initiallyFalse() public {
        vm.prank(customerAddr);
        ecommerce.createInvoice(1);

        assertFalse(ecommerce.getInvoice(1).isPaid);
    }

    function test_getInvoicesByCustomer_returnsCorrectList() public {
        vm.prank(customerAddr);
        ecommerce.createInvoice(1);

        uint256[] memory ids = ecommerce.getInvoicesByCustomer(customerAddr);
        assertEq(ids.length, 1);
        assertEq(ids[0], 1);
    }

    function test_getInvoicesByCustomer_emptyForNoInvoices() public {
        address other = makeAddr("other");
        uint256[] memory ids = ecommerce.getInvoicesByCustomer(other);
        assertEq(ids.length, 0);
    }

    function test_getInvoicesByCompany_returnsCorrectList() public {
        vm.prank(customerAddr);
        ecommerce.createInvoice(1);

        uint256[] memory ids = ecommerce.getInvoicesByCompany(1);
        assertEq(ids.length, 1);
        assertEq(ids[0], 1);
    }

    function test_getInvoice_withValidId_returnsInvoice() public {
        vm.prank(customerAddr);
        ecommerce.createInvoice(1);

        InvoiceLib.Invoice memory inv = ecommerce.getInvoice(1);
        assertEq(inv.customerAddress, customerAddr);
    }

    // ── Access control / input validation reverts ─────────────────────────────

    function test_createInvoice_revert_emptyCart() public {
        address other = makeAddr("other");
        vm.prank(other);
        vm.expectRevert("Cart is empty");
        ecommerce.createInvoice(1);
    }

    function test_createInvoice_revert_companyNotFound() public {
        vm.prank(customerAddr);
        vm.expectRevert("Company not found");
        ecommerce.createInvoice(999);
    }

    function test_createInvoice_revert_inactiveCompany() public {
        vm.prank(owner);
        ecommerce.toggleCompanyStatus(1);

        vm.prank(customerAddr);
        vm.expectRevert("Company not active");
        ecommerce.createInvoice(1);
    }

    function test_createInvoice_revert_productCompanyMismatch() public {
        // Register second company and add product to it
        address company2Addr = makeAddr("company2");
        vm.prank(company2Addr);
        ecommerce.registerCompany("Beta Corp", "Description");

        vm.prank(company2Addr);
        ecommerce.addProduct("Other Widget", "Description", 300, 5);

        // Cart has products from company 1, try to create invoice for company 2
        vm.prank(customerAddr);
        vm.expectRevert("Product company mismatch");
        ecommerce.createInvoice(2);
    }

    function test_createInvoice_revert_insufficientStock() public {
        // Drain stock manually by having another customer buy
        address other = makeAddr("other2");
        vm.startPrank(other);
        // Buy all stock of PRODUCT_B (10 units)
        ecommerce.addToCart(PRODUCT_B, 10);
        ecommerce.createInvoice(1);
        vm.stopPrank();

        // PRODUCT_B stock is now 0; customerAddr cart still has 1 of PRODUCT_B
        vm.prank(customerAddr);
        vm.expectRevert("Insufficient stock");
        ecommerce.createInvoice(1);
    }

    function test_getInvoice_revert_invalidId() public {
        vm.expectRevert("Invoice not found");
        ecommerce.getInvoice(0);

        vm.expectRevert("Invoice not found");
        ecommerce.getInvoice(999);
    }
}
