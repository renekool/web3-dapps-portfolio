// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/libraries/CustomerLib.sol";
import "./mocks/MockEuroToken.sol";

contract CustomerTest is Test {
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

        vm.prank(companyAddr);
        ecommerce.registerCompany("Acme Corp", "Description");

        // Add a product so customer can addToCart
        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 50);
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    function test_customer_autoRegistered_on_addToCart() public {
        assertFalse(ecommerce.isCustomerRegistered(customerAddr));

        vm.prank(customerAddr);
        vm.expectEmit(true, false, false, false);
        emit Ecommerce.CustomerRegistered(customerAddr);
        ecommerce.addToCart(1, 1);

        assertTrue(ecommerce.isCustomerRegistered(customerAddr));
    }

    function test_getCustomer_returnsCorrectFields() public {
        vm.prank(customerAddr);
        ecommerce.addToCart(1, 1);

        CustomerLib.Customer memory c = ecommerce.getCustomer(customerAddr);
        assertEq(c.customerAddress, customerAddr);
        assertTrue(c.isActive);
        assertGt(c.registeredAt, 0);
    }

    function test_registration_is_idempotent() public {
        vm.startPrank(customerAddr);
        ecommerce.addToCart(1, 1);

        CustomerLib.Customer memory first = ecommerce.getCustomer(customerAddr);

        // Second call should not re-emit CustomerRegistered or change registeredAt
        vm.recordLogs();
        ecommerce.addToCart(1, 1);
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 customerRegisteredSig = keccak256("CustomerRegistered(address)");
        for (uint256 i = 0; i < logs.length; i++) {
            assertNotEq(logs[i].topics[0], customerRegisteredSig);
        }

        CustomerLib.Customer memory second = ecommerce.getCustomer(customerAddr);
        assertEq(first.registeredAt, second.registeredAt);
    }

    function test_isCustomerRegistered_returnsTrue_whenRegistered() public {
        vm.prank(customerAddr);
        ecommerce.addToCart(1, 1);

        assertTrue(ecommerce.isCustomerRegistered(customerAddr));
    }

    function test_isCustomerRegistered_returnsFalse_whenNotRegistered() public view {
        assertFalse(ecommerce.isCustomerRegistered(customerAddr));
    }

    function test_publicAccess_getCustomer_and_isCustomerRegistered() public {
        vm.prank(customerAddr);
        ecommerce.addToCart(1, 1);

        // Anyone can call these functions
        address anyone = makeAddr("anyone");
        vm.prank(anyone);
        assertTrue(ecommerce.isCustomerRegistered(customerAddr));

        vm.prank(anyone);
        CustomerLib.Customer memory c = ecommerce.getCustomer(customerAddr);
        assertEq(c.customerAddress, customerAddr);
    }

    // ── Input validation reverts ──────────────────────────────────────────────

    function test_getCustomer_revert_notRegistered() public {
        vm.expectRevert("Customer not found");
        ecommerce.getCustomer(customerAddr);
    }
}
