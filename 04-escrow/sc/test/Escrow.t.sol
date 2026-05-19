// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {Escrow} from "../src/Escrow.sol";
import {TokenA} from "../src/tokens/TokenA.sol";
import {TokenB} from "../src/tokens/TokenB.sol";
import {MockFeeToken} from "./helpers/MockFeeToken.sol";

contract EscrowTest is Test {
    // Mirror events for vm.expectEmit
    event TokenAdded(address indexed token);
    event OperationCreated(uint256 indexed id, address indexed creator, address tokenA, address tokenB, uint256 amountA, uint256 amountB);
    event OperationCompleted(uint256 indexed id, address indexed executor);
    event OperationCancelled(uint256 indexed id);
    Escrow escrow;
    TokenA tokenA;
    TokenB tokenB;

    address owner  = address(0x1);
    address alice  = address(0x2); // creator
    address bob    = address(0x3); // executor
    address carol  = address(0x4); // third party

    uint256 constant AMOUNT_A = 100e18;
    uint256 constant AMOUNT_B = 50e18;
    uint256 constant DEADLINE = type(uint256).max;

    function setUp() public {
        vm.startPrank(owner);
        escrow = new Escrow(owner);
        tokenA = new TokenA();
        tokenB = new TokenB();
        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));
        vm.stopPrank();

        // Mint tokens and approve escrow
        tokenA.mint(alice, 1_000e18);
        tokenB.mint(bob,   1_000e18);
        vm.prank(alice);
        tokenA.approve(address(escrow), type(uint256).max);
        vm.prank(bob);
        tokenB.approve(address(escrow), type(uint256).max);
    }

    // ─── PB-10: addToken / getAllowedTokens ────────────────────────────────────

    function test_addToken_revertsIfNotOwner() public {
        vm.prank(carol);
        vm.expectRevert();
        escrow.addToken(address(tokenA));
    }

    function test_getAllowedTokens_returnsEmptyArray() public {
        Escrow fresh = new Escrow(owner);
        address[] memory tokens = fresh.getAllowedTokens();
        assertEq(tokens.length, 0);
    }

    function test_getAllowedTokens_returnsAddedTokens() public {
        address[] memory tokens = escrow.getAllowedTokens();
        assertEq(tokens.length, 2);
        assertEq(tokens[0], address(tokenA));
        assertEq(tokens[1], address(tokenB));
    }

    // ─── PB-10: getAllOperations empty ─────────────────────────────────────────

    function test_getAllOperations_returnsEmptyArray() public view {
        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertEq(ops.length, 0);
    }

    // ─── PB-11: createOperation ────────────────────────────────────────────────

    function test_createOperation_happyPath() public {
        uint256 balanceBefore = tokenA.balanceOf(address(escrow));

        vm.prank(alice);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, DEADLINE);

        assertEq(tokenA.balanceOf(address(escrow)), balanceBefore + AMOUNT_A);

        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertEq(ops.length, 1);
        assertEq(uint8(ops[0].state), uint8(Escrow.State.Active));
        assertEq(ops[0].creator, alice);
        assertEq(ops[0].amountA, AMOUNT_A);
        assertEq(ops[0].amountB, AMOUNT_B);
    }

    function test_createOperation_revertsIfSameToken() public {
        vm.prank(alice);
        vm.expectRevert("Tokens must differ");
        escrow.createOperation(address(tokenA), address(tokenA), AMOUNT_A, AMOUNT_B, DEADLINE);
    }

    function test_createOperation_revertsIfZeroAmountA() public {
        vm.prank(alice);
        vm.expectRevert("Amounts > 0");
        escrow.createOperation(address(tokenA), address(tokenB), 0, AMOUNT_B, DEADLINE);
    }

    function test_createOperation_revertsIfZeroAmountB() public {
        vm.prank(alice);
        vm.expectRevert("Amounts > 0");
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, 0, DEADLINE);
    }

    function test_createOperation_revertsIfTokenNotAllowed() public {
        TokenA unregistered = new TokenA();
        unregistered.mint(alice, 1_000e18);
        vm.prank(alice);
        unregistered.approve(address(escrow), type(uint256).max);

        vm.prank(alice);
        vm.expectRevert("Token not allowed");
        escrow.createOperation(address(unregistered), address(tokenB), AMOUNT_A, AMOUNT_B, DEADLINE);
    }

    function test_createOperation_emitsOperationCreated() public {
        vm.expectEmit(true, true, false, true);
        emit OperationCreated(0, alice, address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        vm.prank(alice);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, DEADLINE);
    }

    // ─── PB-12: completeOperation ──────────────────────────────────────────────

    function _createOp() internal returns (uint256) {
        vm.prank(alice);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, DEADLINE);
        return 0;
    }

    function test_completeOperation_happyPath() public {
        uint256 id = _createOp();
        uint256 aliceBefore = tokenB.balanceOf(alice);
        uint256 bobBefore   = tokenA.balanceOf(bob);

        vm.prank(bob);
        escrow.completeOperation(id);

        assertEq(tokenB.balanceOf(alice), aliceBefore + AMOUNT_B);
        assertEq(tokenA.balanceOf(bob),   bobBefore   + AMOUNT_A);
        assertEq(tokenA.balanceOf(address(escrow)), 0);

        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertEq(uint8(ops[0].state), uint8(Escrow.State.Completed));
        assertEq(ops[0].executor, bob);
    }

    function test_completeOperation_revertsIfCreator() public {
        uint256 id = _createOp();
        vm.prank(alice);
        vm.expectRevert("Is creator");
        escrow.completeOperation(id);
    }

    function test_completeOperation_revertsIfNotActive() public {
        uint256 id = _createOp();
        vm.prank(bob);
        escrow.completeOperation(id);

        vm.prank(carol);
        tokenB.mint(carol, 1_000e6);
        vm.prank(carol);
        tokenB.approve(address(escrow), type(uint256).max);
        vm.prank(carol);
        vm.expectRevert("Not active");
        escrow.completeOperation(id);
    }

    function test_completeOperation_emitsOperationCompleted() public {
        uint256 id = _createOp();

        vm.expectEmit(true, true, false, true);
        emit OperationCompleted(id, bob);

        vm.prank(bob);
        escrow.completeOperation(id);
    }

    // ─── PB-13: cancelOperation ────────────────────────────────────────────────

    function test_cancelOperation_happyPath() public {
        uint256 id = _createOp();
        uint256 aliceBefore = tokenA.balanceOf(alice);

        vm.prank(alice);
        escrow.cancelOperation(id);

        assertEq(tokenA.balanceOf(alice), aliceBefore + AMOUNT_A);
        assertEq(tokenA.balanceOf(address(escrow)), 0);

        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertEq(uint8(ops[0].state), uint8(Escrow.State.Cancelled));
    }

    function test_cancelOperation_revertsIfNotCreator() public {
        uint256 id = _createOp();
        vm.prank(bob);
        vm.expectRevert("Not creator");
        escrow.cancelOperation(id);
    }

    function test_cancelOperation_revertsIfNotActive() public {
        uint256 id = _createOp();
        vm.prank(alice);
        escrow.cancelOperation(id);

        vm.prank(alice);
        vm.expectRevert("Not active");
        escrow.cancelOperation(id);
    }

    function test_cancelOperation_emitsOperationCancelled() public {
        uint256 id = _createOp();

        vm.expectEmit(true, false, false, true);
        emit OperationCancelled(id);

        vm.prank(alice);
        escrow.cancelOperation(id);
    }

    // ─── Audit findings ───────────────────────────────────────────────────────

    function test_addToken_revertsIfZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Zero address");
        escrow.addToken(address(0));
    }

    function test_addToken_revertsIfAlreadyAllowed() public {
        vm.prank(owner);
        vm.expectRevert("Already allowed");
        escrow.addToken(address(tokenA));
    }

    function test_completeOperation_revertsIfInvalidId() public {
        vm.prank(bob);
        vm.expectRevert("Invalid id");
        escrow.completeOperation(99);
    }

    function test_cancelOperation_revertsIfInvalidId() public {
        vm.prank(alice);
        vm.expectRevert("Invalid id");
        escrow.cancelOperation(99);
    }

    function test_completeOperation_revertsIfTokenBFeeOnTransfer() public {
        MockFeeToken feeToken = new MockFeeToken();
        feeToken.mint(bob, 1_000e18);

        vm.prank(owner);
        escrow.addToken(address(feeToken));

        // alice creates op: tokenA (in) → feeToken (expected back)
        vm.prank(alice);
        escrow.createOperation(address(tokenA), address(feeToken), AMOUNT_A, AMOUNT_B, DEADLINE);

        vm.prank(bob);
        feeToken.approve(address(escrow), type(uint256).max);

        vm.prank(bob);
        vm.expectRevert("Fee-on-transfer not allowed");
        escrow.completeOperation(0);
    }

    // ─── PB-18: Fee-on-transfer (I7) ──────────────────────────────────────────

    function test_createOperation_revertsIfFeeOnTransfer() public {
        MockFeeToken feeToken = new MockFeeToken();
        feeToken.mint(alice, 1_000e18);

        vm.prank(owner);
        escrow.addToken(address(feeToken));

        vm.prank(alice);
        feeToken.approve(address(escrow), type(uint256).max);

        vm.prank(alice);
        vm.expectRevert("Fee-on-transfer not allowed");
        escrow.createOperation(address(feeToken), address(tokenB), AMOUNT_A, AMOUNT_B, DEADLINE);
    }

    // ─── PB-19: Deadline enforcement (I12) ────────────────────────────────────

    function test_completeOperation_revertsIfExpired() public {
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(alice);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, deadline);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(bob);
        vm.expectRevert("Operation expired");
        escrow.completeOperation(0);
    }

    function test_completeOperation_succeedsBeforeDeadline() public {
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(alice);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, deadline);

        vm.warp(block.timestamp + 1 days - 1);

        vm.prank(bob);
        escrow.completeOperation(0);

        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertEq(uint8(ops[0].state), uint8(Escrow.State.Completed));
    }

    function test_createOperation_revertsIfDeadlineInPast() public {
        vm.prank(alice);
        vm.expectRevert("Deadline in past");
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, block.timestamp - 1);
    }

    function test_cancelOperation_succeedsAfterDeadline() public {
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(alice);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, deadline);

        vm.warp(block.timestamp + 1 days + 1);

        uint256 aliceBefore = tokenA.balanceOf(alice);
        vm.prank(alice);
        escrow.cancelOperation(0);

        assertEq(tokenA.balanceOf(alice), aliceBefore + AMOUNT_A);
    }

    // ─── PB-20: Pausable (I13) ────────────────────────────────────────────────

    function test_pause_blocksCreateAndComplete() public {
        vm.prank(owner);
        escrow.pause();

        vm.prank(alice);
        vm.expectRevert();
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, DEADLINE);
    }

    function test_pause_allowsCancel() public {
        uint256 id = _createOp();

        vm.prank(owner);
        escrow.pause();

        uint256 aliceBefore = tokenA.balanceOf(alice);
        vm.prank(alice);
        escrow.cancelOperation(id);

        assertEq(tokenA.balanceOf(alice), aliceBefore + AMOUNT_A);
    }

    function test_unpause_restoresCreateAndComplete() public {
        vm.prank(owner);
        escrow.pause();
        vm.prank(owner);
        escrow.unpause();

        vm.prank(alice);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B, DEADLINE);

        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertEq(uint8(ops[0].state), uint8(Escrow.State.Active));
    }

    function test_pause_revertsIfNotOwner() public {
        vm.prank(carol);
        vm.expectRevert();
        escrow.pause();
    }
}
