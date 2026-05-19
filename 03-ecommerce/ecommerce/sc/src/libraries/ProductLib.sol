// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library ProductLib {

    struct Product {
        uint256 id;
        uint256 companyId;
        string name;
        string description;
        uint256 price;
        uint256 stock;
        bool isActive;
    }

    function add(
        mapping(uint256 => Product) storage products,
        mapping(uint256 => uint256[]) storage companyProductIds,
        uint256 productId,
        uint256 companyId,
        string calldata name,
        string calldata description,
        uint256 price,
        uint256 stock
    ) internal {
        require(bytes(name).length > 0, "Name required");
        require(price > 0, "Price must be > 0");
        require(bytes(description).length <= 200, "Description too long");

        products[productId] = Product({
            id: productId,
            companyId: companyId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            isActive: true
        });
        companyProductIds[companyId].push(productId);
    }

    function update(
        mapping(uint256 => Product) storage products,
        uint256 productId,
        string calldata name,
        string calldata description,
        uint256 price,
        uint256 stock
    ) internal {
        require(bytes(name).length > 0, "Name required");
        require(price > 0, "Price must be > 0");
        require(bytes(description).length <= 200, "Description too long");

        products[productId].name = name;
        products[productId].description = description;
        products[productId].price = price;
        products[productId].stock = stock;
    }

    function getProduct(
        mapping(uint256 => Product) storage products,
        uint256 productId,
        uint256 productCount
    ) internal view returns (Product memory) {
        require(productId > 0 && productId <= productCount, "Product not found");
        return products[productId];
    }

    function getByCompany(
        mapping(uint256 => uint256[]) storage companyProductIds,
        uint256 companyId
    ) internal view returns (uint256[] memory) {
        return companyProductIds[companyId];
    }

    function activate(
        mapping(uint256 => Product) storage products,
        uint256 productId
    ) internal {
        products[productId].isActive = true;
    }

    function deactivate(
        mapping(uint256 => Product) storage products,
        uint256 productId
    ) internal {
        products[productId].isActive = false;
    }
}
