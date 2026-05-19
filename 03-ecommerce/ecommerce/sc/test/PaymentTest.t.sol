// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/libraries/InvoiceLib.sol";
import "../src/libraries/PaymentLib.sol";
import "./mocks/MockEuroToken.sol";

contract PaymentTest is Test {
    Ecommerce ecommerce;
    MockEuroToken mockToken;

    address owner;
    address companyAddr;
    address customerAddr;

    uint256 constant TOTAL_AMOUNT = 200; // price=100 * qty=2

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

        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 50);

        // Customer adds to cart and creates invoice
        vm.startPrank(customerAddr);
        ecommerce.addToCart(1, 2); // total = 200
        ecommerce.createInvoice(1);
        vm.stopPrank();

        // Mint and approve tokens
        mockToken.mint(customerAddr, TOTAL_AMOUNT);
        vm.prank(customerAddr);
        mockToken.approve(address(ecommerce), TOTAL_AMOUNT);
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    function test_processPayment_success_isPaidTrue() public {
        vm.prank(customerAddr);
        ecommerce.processPayment(1);

        InvoiceLib.Invoice memory inv = ecommerce.getInvoice(1);
        assertTrue(inv.isPaid);
    }

    function test_processPayment_emitsPaymentProcessed() public {
        vm.prank(customerAddr);
        // Only check indexed params (invoiceId, customerAddress); ignore amount and txHash
        vm.expectEmit(true, true, false, false);
        emit Ecommerce.PaymentProcessed(1, customerAddr, TOTAL_AMOUNT, bytes32(0));
        ecommerce.processPayment(1);
    }

    function test_processPayment_transfersTokensToCompany() public {
        uint256 companyBalanceBefore = mockToken.balanceOf(companyAddr);

        vm.prank(customerAddr);
        ecommerce.processPayment(1);

        assertEq(mockToken.balanceOf(companyAddr), companyBalanceBefore + TOTAL_AMOUNT);
        assertEq(mockToken.balanceOf(customerAddr), 0);
    }

    function test_processPayment_storesPaymentRecord() public {
        vm.prank(customerAddr);
        ecommerce.processPayment(1);

        PaymentLib.Payment memory p = ecommerce.getPayment(1);
        assertEq(p.paidBy, customerAddr);
        assertEq(p.amount, TOTAL_AMOUNT);
        assertGt(p.paidAt, 0);
    }

    function test_getPayment_returnsCorrectRecord() public {
        vm.prank(customerAddr);
        ecommerce.processPayment(1);

        PaymentLib.Payment memory p = ecommerce.getPayment(1);
        assertEq(p.amount, TOTAL_AMOUNT);
    }

    // ── Access control reverts ─────────────────────────────────────────────────

    function test_processPayment_revert_notInvoiceOwner() public {
        address other = makeAddr("other");
        vm.prank(other);
        vm.expectRevert("Not your invoice");
        ecommerce.processPayment(1);
    }

    // ── Input validation reverts ──────────────────────────────────────────────

    function test_processPayment_revert_invoiceNotFound() public {
        vm.prank(customerAddr);
        vm.expectRevert("Invoice not found");
        ecommerce.processPayment(999);
    }

    function test_processPayment_revert_alreadyPaid() public {
        vm.startPrank(customerAddr);
        ecommerce.processPayment(1);

        // Mint more tokens for second attempt
        mockToken.mint(customerAddr, TOTAL_AMOUNT);
        mockToken.approve(address(ecommerce), TOTAL_AMOUNT);

        vm.expectRevert("Already paid");
        ecommerce.processPayment(1);
        vm.stopPrank();
    }

    function test_processPayment_revert_insufficientAllowance() public {
        // Revoke allowance
        vm.prank(customerAddr);
        mockToken.approve(address(ecommerce), 0);

        vm.prank(customerAddr);
        vm.expectRevert("Insufficient allowance");
        ecommerce.processPayment(1);
    }

    function test_processPayment_revert_insufficientBalance() public {
        // Approve but no balance
        address broke = makeAddr("broke");
        vm.startPrank(broke);
        ecommerce.addToCart(1, 1); // total = 100
        ecommerce.createInvoice(1);
        mockToken.approve(address(ecommerce), 100);
        // Do NOT mint tokens for broke

        vm.expectRevert("Insufficient balance");
        ecommerce.processPayment(2);
        vm.stopPrank();
    }

    function test_getPayment_revert_notPaid() public {
        vm.expectRevert("Payment not found");
        ecommerce.getPayment(1);
    }

    function test_constructor_revert_zeroTokenAddress() public {
        vm.expectRevert("Invalid EuroToken address");
        new Ecommerce(address(0));
    }
}
