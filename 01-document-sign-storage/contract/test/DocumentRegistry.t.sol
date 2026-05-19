// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";

contract DocumentRegistryTest is Test {
    DocumentRegistry public registry;

    address public signer;
    address public user2;
    uint256 public signerPrivateKey;
    uint256 public user2PrivateKey;

    bytes32 public docHash;
    uint256 public docTimestamp;
    bytes public docSignature;

    event DocumentStored(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp,
        bytes signature,
        string fileName,
        string fileCategory
    );

    event DocumentVerified(
        bytes32 indexed hash,
        address indexed signer,
        bool isValid
    );

    string public docName;
    string public docCategory;

    function setUp() public {
        registry = new DocumentRegistry();

        // Setup test signers using Foundry's cheatcodes
        signerPrivateKey = 0xA11CE;
        user2PrivateKey = 0xB0B;

        signer = vm.addr(signerPrivateKey);
        user2 = vm.addr(user2PrivateKey);

        // Basic document info for signer
        docHash = keccak256(abi.encodePacked("test document content"));
        docTimestamp = uint256(block.timestamp);
        docSignature = "signer signature";
        docName = "test_doc.pdf";
        docCategory = "Legal";
    }

    // =============================================================
    //                         RF-05 / RF-20 / RF-21
    // =============================================================

    // Verifica que un documento se guarde exitosamente con todos sus datos y emita el evento.
    function testStoreDocumentHash() public {
        vm.prank(signer);

        vm.expectEmit(true, true, false, true);
        emit DocumentStored(
            docHash,
            signer,
            docTimestamp,
            docSignature,
            docName,
            docCategory
        );

        registry.storeDocumentHash(
            docHash,
            docTimestamp,
            docSignature,
            signer,
            docName,
            docCategory
        );

        // Verify storage state
        DocumentRegistry.Document memory doc = registry.getDocumentInfo(
            docHash
        );
        bytes32 storedHash = doc.hash;
        uint256 storedTimestamp = doc.timestamp;
        address storedSigner = doc.signer;
        bytes memory storedSignature = doc.signature;
        string memory storedName = doc.fileName;
        string memory storedCategory = doc.fileCategory;

        assertEq(storedHash, docHash);
        assertEq(storedTimestamp, docTimestamp);
        assertEq(storedSigner, signer);
        assertEq(storedSignature, docSignature);
        assertEq(storedName, docName);
        assertEq(storedCategory, docCategory);
        assertTrue(registry.isDocumentStored(docHash));
    }

    // Comprueba que la transaccion falle si se intenta guardar sin la firma adjunta.
    function testRevertStoreEmptySignature() public {
        vm.prank(signer);
        bytes memory emptySig = "";

        vm.expectRevert("Firma requerida");
        registry.storeDocumentHash(
            docHash,
            docTimestamp,
            emptySig,
            signer,
            docName,
            docCategory
        );
    }

    // =============================================================
    //                         RF-06
    // =============================================================

    // Asegura que intentar registrar el mismo hash dos veces lance un error de "duplicado".
    function testRevertStoreDuplicateDocument() public {
        // Initial store
        vm.prank(signer);
        registry.storeDocumentHash(
            docHash,
            docTimestamp,
            docSignature,
            signer,
            docName,
            docCategory
        );

        // Attempt duplicate store
        vm.prank(signer);
        vm.expectRevert("Documento ya registrado");
        registry.storeDocumentHash(
            docHash,
            docTimestamp,
            docSignature,
            signer,
            docName,
            docCategory
        );
    }

    // =============================================================
    //                         RF-08 / RF-09 / RF-10
    // =============================================================

    // Confirma que la verificacion basica on-chain pase si el firmante y la firma coinciden exactamente.
    function testVerifyDocument() public {
        // Store first
        vm.prank(signer);
        registry.storeDocumentHash(
            docHash,
            docTimestamp,
            docSignature,
            signer,
            docName,
            docCategory
        );

        // Verify - should match exact signer and signature
        bool isValid = registry.verifyDocument(docHash, signer, docSignature);
        assertTrue(isValid);
    }

    // Confirma que la verificacion devuelva 'false' si se le entrega la cuenta incorrecta de quien firmo.
    function testVerifyDocumentWrongSigner() public {
        vm.prank(signer);
        registry.storeDocumentHash(
            docHash,
            docTimestamp,
            docSignature,
            signer,
            docName,
            docCategory
        );

        address wrongSigner = address(0x123);
        bool isValid = registry.verifyDocument(
            docHash,
            wrongSigner,
            docSignature
        );
        assertFalse(isValid);
    }

    // Confirma que la verificacion devuelva 'false' si se le entrega una firma incorrecta.
    function testVerifyDocumentWrongSignature() public {
        vm.prank(signer);
        registry.storeDocumentHash(
            docHash,
            docTimestamp,
            docSignature,
            signer,
            docName,
            docCategory
        );

        bytes memory wrongSignature = "wrong signature";
        bool isValid = registry.verifyDocument(docHash, signer, wrongSignature);
        assertFalse(isValid);
    }

    // Comprueba que no se pueda verificar un documento cuyo hash nunca se ha almacenado.
    function testVerifyNonExistentDocument() public {
        bytes32 nonExistentHash = keccak256("doesn't exist");

        vm.expectRevert("Documento no registrado");
        registry.verifyDocument(nonExistentHash, signer, docSignature);
    }

    // =============================================================
    //                         CONSULTAS E ISOLATION
    // =============================================================

    // Valida que al buscar un documento existente, se retorne correctamente la firma que se habia guardado.
    function testGetDocumentSignature() public {
        vm.prank(signer);
        registry.storeDocumentHash(
            docHash,
            docTimestamp,
            docSignature,
            signer,
            docName,
            docCategory
        );

        bytes memory retrievedSignature = registry.getDocumentSignature(
            docHash
        );
        assertEq(retrievedSignature, docSignature);
    }

    // Bloquea intentar pedir la firma de un documento que no ha sido registrado.
    function testRevertGetNonExistentSignature() public {
        vm.expectRevert("Documento no registrado");
        registry.getDocumentSignature(docHash);
    }

    // Bloquea intentar pedir informacion de un documento imaginario (no registrado).
    function testRevertGetNonExistentDocument() public {
        vm.expectRevert("Documento no registrado");
        registry.getDocumentInfo(docHash);
    }

    // Prueba intensiva de privacidad: verifica que multiples usuarios guarden sus documentos
    // y que nadie pueda engañar el sistema verificando cruzado firmas ajenas.
    function testMultipleUsersStoreDocuments() public {
        // Signer stores document
        bytes32 documentHash1 = keccak256("user1 document");
        uint256 timestamp1 = uint256(block.timestamp);
        bytes memory signature1 = "user1 signature";

        vm.prank(signer);
        registry.storeDocumentHash(
            documentHash1,
            timestamp1,
            signature1,
            signer,
            "doc1.txt",
            "Cat1"
        );

        // User 2 stores document
        bytes32 documentHash2 = keccak256("user2 document");
        uint256 timestamp2 = uint256(block.timestamp + 10);
        bytes memory signature2 = "user2 signature";

        vm.prank(user2);
        registry.storeDocumentHash(
            documentHash2,
            timestamp2,
            signature2,
            user2,
            "doc2.txt",
            "Cat2"
        );

        // Verify both documents exist
        assertTrue(registry.isDocumentStored(documentHash1));
        assertTrue(registry.isDocumentStored(documentHash2));

        // Verify correct signatures against specific users
        assertTrue(registry.verifyDocument(documentHash1, signer, signature1));
        assertTrue(registry.verifyDocument(documentHash2, user2, signature2));

        // Verify cross-verification fails
        assertFalse(registry.verifyDocument(documentHash1, user2, signature1));
        assertFalse(registry.verifyDocument(documentHash2, signer, signature2));
    }
}
