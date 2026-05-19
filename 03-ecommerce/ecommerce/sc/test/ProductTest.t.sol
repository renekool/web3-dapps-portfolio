// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/libraries/ProductLib.sol";
import "./mocks/MockEuroToken.sol";

contract ProductTest is Test {
    Ecommerce ecommerce;
    MockEuroToken mockToken;

    address owner;
    address companyAddr;
    address customerAddr;

    uint256 companyId;

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

        companyId = 1;
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    function test_addProduct_success() public {
        vm.prank(companyAddr);
        vm.expectEmit(true, true, false, true);
        emit Ecommerce.ProductAdded(1, companyId, "Widget", 100, 50);
        ecommerce.addProduct("Widget", "Description", 100, 50);

        ProductLib.Product memory p = ecommerce.getProduct(1);
        assertEq(p.id, 1);
        assertEq(p.companyId, companyId);
        assertEq(p.name, "Widget");
        assertEq(p.price, 100);
        assertEq(p.stock, 50);
        assertTrue(p.isActive);
        assertEq(ecommerce.productCount(), 1);
    }

    function test_productId_is_global_and_sequential() public {
        address company2Addr = makeAddr("company2");
        vm.prank(company2Addr);
        ecommerce.registerCompany("Beta Corp", "Description");

        vm.prank(companyAddr);
        ecommerce.addProduct("Widget A", "Description", 100, 10);

        vm.prank(company2Addr);
        ecommerce.addProduct("Widget B", "Description", 200, 20);

        assertEq(ecommerce.productCount(), 2);
        assertEq(ecommerce.getProduct(1).companyId, 1);
        assertEq(ecommerce.getProduct(2).companyId, 2);
    }

    function test_updateProduct_success() public {
        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 50);

        vm.prank(companyAddr);
        vm.expectEmit(true, false, false, true);
        emit Ecommerce.ProductUpdated(1, "Super Widget", 200, 30);
        ecommerce.updateProduct(1, "Super Widget", "Description", 200, 30);

        ProductLib.Product memory p = ecommerce.getProduct(1);
        assertEq(p.name, "Super Widget");
        assertEq(p.price, 200);
        assertEq(p.stock, 30);
    }

    function test_getProductsByCompany_returnsCorrectList() public {
        vm.startPrank(companyAddr);
        ecommerce.addProduct("Widget A", "Description", 100, 10);
        ecommerce.addProduct("Widget B", "Description", 200, 20);
        vm.stopPrank();

        uint256[] memory ids = ecommerce.getProductsByCompany(companyId);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }

    function test_getProductsByCompany_emptyForNoProducts() public view {
        uint256[] memory ids = ecommerce.getProductsByCompany(companyId);
        assertEq(ids.length, 0);
    }

    function test_toggleProductStatus_setsInactiveAndEmitsEvent() public {
        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 10);

        vm.prank(companyAddr);
        vm.expectEmit(true, false, false, false);
        emit Ecommerce.ProductDeactivated(1);
        ecommerce.toggleProductStatus(1);

        ProductLib.Product memory p = ecommerce.getProduct(1);
        assertFalse(p.isActive);
    }

    function test_toggleProductStatus_setsActiveAndEmitsEvent() public {
        vm.startPrank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 10);
        ecommerce.toggleProductStatus(1);

        vm.expectEmit(true, false, false, false);
        emit Ecommerce.ProductActivated(1);
        ecommerce.toggleProductStatus(1);
        vm.stopPrank();

        ProductLib.Product memory p = ecommerce.getProduct(1);
        assertTrue(p.isActive);
    }

    function test_deactivatedProduct_stillQueryable() public {
        vm.startPrank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 10);
        ecommerce.toggleProductStatus(1);
        vm.stopPrank();

        ProductLib.Product memory p = ecommerce.getProduct(1);
        assertEq(p.name, "Widget");
        assertFalse(p.isActive);
    }

    function test_addProduct_stockZeroIsAccepted() public {
        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 0);
        assertEq(ecommerce.productCount(), 1);
        assertEq(ecommerce.getProduct(1).stock, 0);
    }

    // ── Access control reverts ─────────────────────────────────────────────────

    function test_addProduct_revert_notRegisteredCompany() public {
        vm.prank(customerAddr);
        vm.expectRevert("Not a registered company");
        ecommerce.addProduct("Widget", "Description", 100, 10);
    }

    function test_addProduct_revert_inactiveCompany() public {
        vm.prank(owner);
        ecommerce.toggleCompanyStatus(companyId);

        vm.prank(companyAddr);
        vm.expectRevert("Company not active");
        ecommerce.addProduct("Widget", "Description", 100, 10);
    }

    function test_updateProduct_revert_notYourProduct() public {
        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 10);

        address company2Addr = makeAddr("company2");
        vm.prank(company2Addr);
        ecommerce.registerCompany("Beta Corp", "Description");

        vm.prank(company2Addr);
        vm.expectRevert("Not your product");
        ecommerce.updateProduct(1, "Widget", "Description", 100, 10);
    }

    function test_activateDeactivate_revert_notRegisteredCompany() public {
        vm.prank(companyAddr);
        ecommerce.addProduct("Widget", "Description", 100, 10);

        vm.prank(customerAddr);
        vm.expectRevert("Not a registered company");
        ecommerce.toggleProductStatus(1);

        vm.prank(customerAddr);
        vm.expectRevert("Not a registered company");
        ecommerce.toggleProductStatus(1);
    }

    // ── Input validation reverts ──────────────────────────────────────────────

    function test_addProduct_revert_emptyName() public {
        vm.prank(companyAddr);
        vm.expectRevert("Name required");
        ecommerce.addProduct("", "Description", 100, 10);
    }

    function test_addProduct_revert_zeroPrice() public {
        vm.prank(companyAddr);
        vm.expectRevert("Price must be > 0");
        ecommerce.addProduct("Widget", "Description", 0, 10);
    }

    function test_updateProduct_revert_nonExistentProduct() public {
        vm.prank(companyAddr);
        vm.expectRevert("Not your product");
        ecommerce.updateProduct(999, "Widget", "Description", 100, 10);
    }

    function test_getProduct_revert_invalidId() public {
        vm.expectRevert("Product not found");
        ecommerce.getProduct(0);

        vm.expectRevert("Product not found");
        ecommerce.getProduct(999);
    }
}
