// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/libraries/CartLib.sol";
import "./mocks/MockEuroToken.sol";

contract CartTest is Test {
    Ecommerce ecommerce;
    MockEuroToken mockToken;

    address owner;
    address companyAddr;
    address customerAddr;

    uint256 constant PRODUCT_A = 1;
    uint256 constant PRODUCT_B = 2;

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
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    function test_addToCart_registersCustomerImplicitly() public {
        assertFalse(ecommerce.isCustomerRegistered(customerAddr));

        vm.prank(customerAddr);
        vm.expectEmit(true, false, false, false);
        emit Ecommerce.CustomerRegistered(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 1);

        assertTrue(ecommerce.isCustomerRegistered(customerAddr));
    }

    function test_addToCart_doesNotReregisterExistingCustomer() public {
        vm.startPrank(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 1);

        // Second addToCart should NOT emit CustomerRegistered
        vm.recordLogs();
        ecommerce.addToCart(PRODUCT_A, 1);
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 customerRegisteredSig = keccak256("CustomerRegistered(address)");
        for (uint256 i = 0; i < logs.length; i++) {
            assertNotEq(logs[i].topics[0], customerRegisteredSig);
        }
    }

    function test_addToCart_newItem_createsCartItemAndEmitsEvent() public {
        vm.prank(customerAddr);
        vm.expectEmit(true, true, false, true);
        emit Ecommerce.CartUpdated(customerAddr, PRODUCT_A, 3);
        ecommerce.addToCart(PRODUCT_A, 3);

        CartLib.CartItem[] memory cart = ecommerce.getCart(customerAddr);
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, PRODUCT_A);
        assertEq(cart[0].quantity, 3);
    }

    function test_addToCart_existingItem_accumulatesQuantity() public {
        vm.startPrank(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 2);
        ecommerce.addToCart(PRODUCT_A, 3);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customerAddr);
        assertEq(cart.length, 1);
        assertEq(cart[0].quantity, 5);
    }

    function test_addToCart_multipleDistinctProducts_oneEntryEach() public {
        vm.startPrank(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 1);
        ecommerce.addToCart(PRODUCT_B, 2);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customerAddr);
        assertEq(cart.length, 2);
    }

    function test_getCart_returnsCorrectArrayAfterAdditions() public {
        vm.startPrank(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 5);
        ecommerce.addToCart(PRODUCT_B, 3);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customerAddr);
        assertEq(cart.length, 2);
        assertEq(cart[0].productId, PRODUCT_A);
        assertEq(cart[0].quantity, 5);
        assertEq(cart[1].productId, PRODUCT_B);
        assertEq(cart[1].quantity, 3);
    }

    function test_getCart_emptyForCustomerWithNoItems() public view {
        CartLib.CartItem[] memory cart = ecommerce.getCart(customerAddr);
        assertEq(cart.length, 0);
    }

    function test_getCartTotal_singleItem() public {
        vm.prank(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 3); // price=100, qty=3 → 300

        uint256 total = ecommerce.getCartTotal(customerAddr);
        assertEq(total, 300);
    }

    function test_getCartTotal_multipleItems() public {
        vm.startPrank(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 2); // 100 * 2 = 200
        ecommerce.addToCart(PRODUCT_B, 1); // 200 * 1 = 200
        vm.stopPrank();

        uint256 total = ecommerce.getCartTotal(customerAddr);
        assertEq(total, 400);
    }

    function test_getCartTotal_emptyCart_returnsZero() public view {
        assertEq(ecommerce.getCartTotal(customerAddr), 0);
    }

    function test_createInvoice_clearsCart_and_emitsCartCleared() public {
        vm.startPrank(customerAddr);
        ecommerce.addToCart(PRODUCT_A, 1);

        vm.expectEmit(true, false, false, false);
        emit Ecommerce.CartCleared(customerAddr);
        ecommerce.createInvoice(1);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customerAddr);
        assertEq(cart.length, 0);
    }

    // ── Access control / input validation reverts ─────────────────────────────

    function test_addToCart_revert_productNotFound() public {
        vm.prank(customerAddr);
        vm.expectRevert("Product not found");
        ecommerce.addToCart(999, 1);
    }

    function test_addToCart_revert_productInactive() public {
        vm.prank(companyAddr);
        ecommerce.toggleProductStatus(PRODUCT_A);

        vm.prank(customerAddr);
        vm.expectRevert("Product not active");
        ecommerce.addToCart(PRODUCT_A, 1);
    }

    function test_addToCart_revert_zeroQuantity() public {
        vm.prank(customerAddr);
        vm.expectRevert("Quantity must be > 0");
        ecommerce.addToCart(PRODUCT_A, 0);
    }

    function test_addToCart_revert_insufficientStock() public {
        vm.prank(customerAddr);
        vm.expectRevert("Insufficient stock");
        ecommerce.addToCart(PRODUCT_A, 100); // stock is 50
    }

    function test_addToCart_revert_cartFull() public {
        // Add 18 more products (setUp has 2: Widget A and Widget B)
        vm.startPrank(companyAddr);
        for (uint256 i = 3; i <= 21; i++) {
            ecommerce.addProduct(string.concat("Widget ", vm.toString(i)), "Description", 100, 50);
        }
        vm.stopPrank();

        // Fill cart to MAX_CART_ITEMS (20) with distinct products
        vm.startPrank(customerAddr);
        for (uint256 i = 1; i <= 20; i++) {
            ecommerce.addToCart(i, 1);
        }

        // 21st distinct product must fail
        vm.expectRevert("Cart is full");
        ecommerce.addToCart(21, 1);
        vm.stopPrank();
    }
}
