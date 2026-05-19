// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ProductLib} from "./ProductLib.sol";

library CartLib {

    uint256 constant MAX_CART_ITEMS = 20;

    struct CartItem {
        uint256 productId;
        uint256 quantity;
    }

    function addItem(
        mapping(address => CartItem[]) storage carts,
        mapping(uint256 => ProductLib.Product) storage products,
        uint256 productCount,
        address caller,
        uint256 productId,
        uint256 quantity
    ) internal {
        require(quantity > 0, "Quantity must be > 0");
        require(productId > 0 && productId <= productCount, "Product not found");
        require(products[productId].isActive, "Product not active");
        require(products[productId].stock >= quantity, "Insufficient stock");

        CartItem[] storage cart = carts[caller];
        for (uint256 i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                cart[i].quantity += quantity;
                return;
            }
        }
        require(cart.length < MAX_CART_ITEMS, "Cart is full");
        cart.push(CartItem({productId: productId, quantity: quantity}));
    }

    function getCart(
        mapping(address => CartItem[]) storage carts,
        address caller
    ) internal view returns (CartItem[] memory) {
        return carts[caller];
    }

    function getCartTotal(
        mapping(address => CartItem[]) storage carts,
        mapping(uint256 => ProductLib.Product) storage products,
        address caller
    ) internal view returns (uint256 total) {
        CartItem[] storage cart = carts[caller];
        for (uint256 i = 0; i < cart.length; i++) {
            total += products[cart[i].productId].price * cart[i].quantity;
        }
    }

    function clearCart(
        mapping(address => CartItem[]) storage carts,
        address caller
    ) internal {
        delete carts[caller];
    }
}
