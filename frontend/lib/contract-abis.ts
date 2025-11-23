// Contract ABIs - import from your uploaded files
export const CHAMA_FACTORY_ABI = [

    {
        "type": "constructor",
        "inputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "chamaIndex",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "chamas",
        "inputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "membershipToken",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "governor",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "createdAt",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "name",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "bankObserver",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "createChama",
        "inputs": [
            {
                "name": "chamaName",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "tokenSymbol",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "founders",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "bankObserver",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "governorAddress",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "tokenAddress",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "getAllChamas",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "tuple[]",
                "internalType": "struct ChamaFactory.ChamaInfo[]",
                "components": [
                    {
                        "name": "membershipToken",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "governor",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "founders",
                        "type": "address[]",
                        "internalType": "address[]"
                    },
                    {
                        "name": "createdAt",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "name",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "bankObserver",
                        "type": "address",
                        "internalType": "address"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getChamaByGovernor",
        "inputs": [
            {
                "name": "gov",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "tuple",
                "internalType": "struct ChamaFactory.ChamaInfo",
                "components": [
                    {
                        "name": "membershipToken",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "governor",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "founders",
                        "type": "address[]",
                        "internalType": "address[]"
                    },
                    {
                        "name": "createdAt",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "name",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "bankObserver",
                        "type": "address",
                        "internalType": "address"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getChamaById",
        "inputs": [
            {
                "name": "id",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "tuple",
                "internalType": "struct ChamaFactory.ChamaInfo",
                "components": [
                    {
                        "name": "membershipToken",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "governor",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "founders",
                        "type": "address[]",
                        "internalType": "address[]"
                    },
                    {
                        "name": "createdAt",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "name",
                        "type": "string",
                        "internalType": "string"
                    },
                    {
                        "name": "bankObserver",
                        "type": "address",
                        "internalType": "address"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getChamaCount",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getUserChamaCount",
        "inputs": [
            {
                "name": "user",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getUserChamas",
        "inputs": [
            {
                "name": "user",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "address[]",
                "internalType": "address[]"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "governorImplementation",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "isFounder",
        "inputs": [
            {
                "name": "user",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "gov",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "tokenImplementation",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "userChamas",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "ChamaCreated",
        "inputs": [
            {
                "name": "governor",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "membershipToken",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "founders",
                "type": "address[]",
                "indexed": false,
                "internalType": "address[]"
            },
            {
                "name": "name",
                "type": "string",
                "indexed": false,
                "internalType": "string"
            },
            {
                "name": "bankObserver",
                "type": "address",
                "indexed": false,
                "internalType": "address"
            },
            {
                "name": "chamaId",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "FailedDeployment",
        "inputs": []
    },
    {
        "type": "error",
        "name": "InsufficientBalance",
        "inputs": [
            {
                "name": "balance",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "needed",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    }
] as const

export const CHAMA_GOVERNOR_ABI = [
    {
        "type": "constructor",
        "inputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "receive",
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "BALLOT_TYPEHASH",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "CLOCK_MODE",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "COUNTING_MODE",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "pure"
    },
    {
        "type": "function",
        "name": "EXTENDED_BALLOT_TYPEHASH",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "bank",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "cancel",
        "inputs": [
            {
                "name": "targets",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "calldatas",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "descriptionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "castVote",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "support",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "castVoteBySig",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "support",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "voter",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "signature",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "castVoteWithReason",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "support",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "reason",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "castVoteWithReasonAndParams",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "support",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "reason",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "params",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "castVoteWithReasonAndParamsBySig",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "support",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "voter",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "reason",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "params",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "signature",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "clock",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint48",
                "internalType": "uint48"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "constitutionHash",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "eip712Domain",
        "inputs": [],
        "outputs": [
            {
                "name": "fields",
                "type": "bytes1",
                "internalType": "bytes1"
            },
            {
                "name": "name",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "version",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "chainId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "verifyingContract",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "salt",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "extensions",
                "type": "uint256[]",
                "internalType": "uint256[]"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "execute",
        "inputs": [
            {
                "name": "targets",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "calldatas",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "descriptionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "getIpfsHash",
        "inputs": [
            {
                "name": "pid",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getProposalId",
        "inputs": [
            {
                "name": "targets",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "calldatas",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "descriptionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getVotes",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "timepoint",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getVotesWithParams",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "timepoint",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "params",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "hasVoted",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "hashProposal",
        "inputs": [
            {
                "name": "targets",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "calldatas",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "descriptionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "pure"
    },
    {
        "type": "function",
        "name": "initialize",
        "inputs": [
            {
                "name": "token_",
                "type": "address",
                "internalType": "contract IVotes"
            },
            {
                "name": "name_",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "bank_",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "initializeFounders",
        "inputs": [
            {
                "name": "",
                "type": "address[]",
                "internalType": "address[]"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "isActiveMember",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "name",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "nonces",
        "inputs": [
            {
                "name": "owner",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "onERC1155BatchReceived",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bytes4",
                "internalType": "bytes4"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "onERC1155Received",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bytes4",
                "internalType": "bytes4"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "onERC721Received",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bytes4",
                "internalType": "bytes4"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "proposalDeadline",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "proposalEta",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "proposalMetadata",
        "inputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "pType",
                "type": "uint8",
                "internalType": "enum ChamaGovernor.ProposalType"
            },
            {
                "name": "target",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "amt",
                "type": "uint96",
                "internalType": "uint96"
            },
            {
                "name": "executed",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "proposalNeedsQueuing",
        "inputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "proposalProposer",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "proposalSnapshot",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "proposalThreshold",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "proposalVotes",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "againstVotes",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "forVotes",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "abstainVotes",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "propose",
        "inputs": [
            {
                "name": "targets",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "calldatas",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "description",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "proposeWithMetadata",
        "inputs": [
            {
                "name": "targets",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "calldatas",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "description",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "pType",
                "type": "uint8",
                "internalType": "enum ChamaGovernor.ProposalType"
            },
            {
                "name": "target",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "amt",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ipfsHash",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "queue",
        "inputs": [
            {
                "name": "targets",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "calldatas",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "descriptionHash",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "quorum",
        "inputs": [
            {
                "name": "blockNumber",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "quorumDenominator",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "quorumNumerator",
        "inputs": [
            {
                "name": "timepoint",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "quorumNumerator",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "relay",
        "inputs": [
            {
                "name": "target",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "value",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "data",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "setProposalThreshold",
        "inputs": [
            {
                "name": "newProposalThreshold",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "setVotingDelay",
        "inputs": [
            {
                "name": "newVotingDelay",
                "type": "uint48",
                "internalType": "uint48"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "setVotingPeriod",
        "inputs": [
            {
                "name": "newVotingPeriod",
                "type": "uint32",
                "internalType": "uint32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "state",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint8",
                "internalType": "enum IGovernor.ProposalState"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "supportsInterface",
        "inputs": [
            {
                "name": "interfaceId",
                "type": "bytes4",
                "internalType": "bytes4"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "token",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "contract IERC5805"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "updateBank",
        "inputs": [
            {
                "name": "newBank",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "updateQuorumNumerator",
        "inputs": [
            {
                "name": "newQuorumNumerator",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "version",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "votingDelay",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "votingPeriod",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "ConstitutionUpdated",
        "inputs": [
            {
                "name": "hash",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "ContributionUpdated",
        "inputs": [
            {
                "name": "amount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "EIP712DomainChanged",
        "inputs": [],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Initialized",
        "inputs": [
            {
                "name": "version",
                "type": "uint64",
                "indexed": false,
                "internalType": "uint64"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "LoanApproved",
        "inputs": [
            {
                "name": "borrower",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "amount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "proposalId",
                "type": "uint256",
                "indexed": true,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "MemberAdded",
        "inputs": [
            {
                "name": "member",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "MemberRemoved",
        "inputs": [
            {
                "name": "member",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "ProposalCanceled",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "ProposalCreated",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "proposer",
                "type": "address",
                "indexed": false,
                "internalType": "address"
            },
            {
                "name": "targets",
                "type": "address[]",
                "indexed": false,
                "internalType": "address[]"
            },
            {
                "name": "values",
                "type": "uint256[]",
                "indexed": false,
                "internalType": "uint256[]"
            },
            {
                "name": "signatures",
                "type": "string[]",
                "indexed": false,
                "internalType": "string[]"
            },
            {
                "name": "calldatas",
                "type": "bytes[]",
                "indexed": false,
                "internalType": "bytes[]"
            },
            {
                "name": "voteStart",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "voteEnd",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "description",
                "type": "string",
                "indexed": false,
                "internalType": "string"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "ProposalExecuted",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "ProposalQueued",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "etaSeconds",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "ProposalThresholdSet",
        "inputs": [
            {
                "name": "oldProposalThreshold",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "newProposalThreshold",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "QuorumNumeratorUpdated",
        "inputs": [
            {
                "name": "oldQuorumNumerator",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "newQuorumNumerator",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "VoteCast",
        "inputs": [
            {
                "name": "voter",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "proposalId",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "support",
                "type": "uint8",
                "indexed": false,
                "internalType": "uint8"
            },
            {
                "name": "weight",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "reason",
                "type": "string",
                "indexed": false,
                "internalType": "string"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "VoteCastWithParams",
        "inputs": [
            {
                "name": "voter",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "proposalId",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "support",
                "type": "uint8",
                "indexed": false,
                "internalType": "uint8"
            },
            {
                "name": "weight",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "reason",
                "type": "string",
                "indexed": false,
                "internalType": "string"
            },
            {
                "name": "params",
                "type": "bytes",
                "indexed": false,
                "internalType": "bytes"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "VotingDelaySet",
        "inputs": [
            {
                "name": "oldVotingDelay",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "newVotingDelay",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "VotingPeriodSet",
        "inputs": [
            {
                "name": "oldVotingPeriod",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "newVotingPeriod",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "CheckpointUnorderedInsertion",
        "inputs": []
    },
    {
        "type": "error",
        "name": "FailedCall",
        "inputs": []
    },
    {
        "type": "error",
        "name": "GovernorAlreadyCastVote",
        "inputs": [
            {
                "name": "voter",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorAlreadyQueuedProposal",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorDisabledDeposit",
        "inputs": []
    },
    {
        "type": "error",
        "name": "GovernorInsufficientProposerVotes",
        "inputs": [
            {
                "name": "proposer",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "votes",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "threshold",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorInvalidProposalLength",
        "inputs": [
            {
                "name": "targets",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "calldatas",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "values",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorInvalidQuorumFraction",
        "inputs": [
            {
                "name": "quorumNumerator",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "quorumDenominator",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorInvalidSignature",
        "inputs": [
            {
                "name": "voter",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorInvalidVoteParams",
        "inputs": []
    },
    {
        "type": "error",
        "name": "GovernorInvalidVoteType",
        "inputs": []
    },
    {
        "type": "error",
        "name": "GovernorInvalidVotingPeriod",
        "inputs": [
            {
                "name": "votingPeriod",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorNonexistentProposal",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorNotQueuedProposal",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorOnlyExecutor",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorQueueNotImplemented",
        "inputs": []
    },
    {
        "type": "error",
        "name": "GovernorRestrictedProposer",
        "inputs": [
            {
                "name": "proposer",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorUnableToCancel",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "GovernorUnexpectedProposalState",
        "inputs": [
            {
                "name": "proposalId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "current",
                "type": "uint8",
                "internalType": "enum IGovernor.ProposalState"
            },
            {
                "name": "expectedStates",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ]
    },
    {
        "type": "error",
        "name": "InvalidAccountNonce",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "currentNonce",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "InvalidInitialization",
        "inputs": []
    },
    {
        "type": "error",
        "name": "NotInitializing",
        "inputs": []
    },
    {
        "type": "error",
        "name": "SafeCastOverflowedUintDowncast",
        "inputs": [
            {
                "name": "bits",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "value",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    }
] as const

export const CHAMA_MEMBERSHIP_TOKEN_ABI = [
    {
        "type": "constructor",
        "inputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "CLOCK_MODE",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "DOMAIN_SEPARATOR",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "VOTES_PER_MEMBER",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "allowance",
        "inputs": [
            {
                "name": "owner",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "spender",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "approve",
        "inputs": [
            {
                "name": "spender",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "value",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "balanceOf",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "checkpoints",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "pos",
                "type": "uint32",
                "internalType": "uint32"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "tuple",
                "internalType": "struct Checkpoints.Checkpoint208",
                "components": [
                    {
                        "name": "_key",
                        "type": "uint48",
                        "internalType": "uint48"
                    },
                    {
                        "name": "_value",
                        "type": "uint208",
                        "internalType": "uint208"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "clock",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint48",
                "internalType": "uint48"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "decimals",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint8",
                "internalType": "uint8"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "delegate",
        "inputs": [
            {
                "name": "delegatee",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "delegateBySig",
        "inputs": [
            {
                "name": "delegatee",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "nonce",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "expiry",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "v",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "r",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "s",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "delegates",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "eip712Domain",
        "inputs": [],
        "outputs": [
            {
                "name": "fields",
                "type": "bytes1",
                "internalType": "bytes1"
            },
            {
                "name": "name",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "version",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "chainId",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "verifyingContract",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "salt",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "extensions",
                "type": "uint256[]",
                "internalType": "uint256[]"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getMemberCount",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getPastTotalSupply",
        "inputs": [
            {
                "name": "timepoint",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getPastVotes",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "timepoint",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getVotes",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "governor",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "hasMembership",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "initialize",
        "inputs": [
            {
                "name": "name",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "symbol",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "initializeGovernor",
        "inputs": [
            {
                "name": "_governor",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "founders",
                "type": "address[]",
                "internalType": "address[]"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "isInitialized",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "mintMembership",
        "inputs": [
            {
                "name": "to",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "name",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "nonces",
        "inputs": [
            {
                "name": "owner",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "numCheckpoints",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint32",
                "internalType": "uint32"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "permit",
        "inputs": [
            {
                "name": "owner",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "spender",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "value",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "deadline",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "v",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "r",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "s",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "renounceOwnership",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "revokeMembership",
        "inputs": [
            {
                "name": "from",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "symbol",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string",
                "internalType": "string"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "totalSupply",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "transfer",
        "inputs": [
            {
                "name": "to",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "value",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "transferFrom",
        "inputs": [
            {
                "name": "from",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "to",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "value",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "transferOwnership",
        "inputs": [
            {
                "name": "newOwner",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "event",
        "name": "Approval",
        "inputs": [
            {
                "name": "owner",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "spender",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "value",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "DelegateChanged",
        "inputs": [
            {
                "name": "delegator",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "fromDelegate",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "toDelegate",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "DelegateVotesChanged",
        "inputs": [
            {
                "name": "delegate",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "previousVotes",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "newVotes",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "EIP712DomainChanged",
        "inputs": [],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "GovernorSet",
        "inputs": [
            {
                "name": "governor",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Initialized",
        "inputs": [
            {
                "name": "version",
                "type": "uint64",
                "indexed": false,
                "internalType": "uint64"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "MembershipGranted",
        "inputs": [
            {
                "name": "member",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "MembershipRevoked",
        "inputs": [
            {
                "name": "member",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "OwnershipTransferred",
        "inputs": [
            {
                "name": "previousOwner",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "newOwner",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Transfer",
        "inputs": [
            {
                "name": "from",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "to",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "value",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "CheckpointUnorderedInsertion",
        "inputs": []
    },
    {
        "type": "error",
        "name": "ECDSAInvalidSignature",
        "inputs": []
    },
    {
        "type": "error",
        "name": "ECDSAInvalidSignatureLength",
        "inputs": [
            {
                "name": "length",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "ECDSAInvalidSignatureS",
        "inputs": [
            {
                "name": "s",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC20ExceededSafeSupply",
        "inputs": [
            {
                "name": "increasedSupply",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "cap",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC20InsufficientAllowance",
        "inputs": [
            {
                "name": "spender",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "allowance",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "needed",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC20InsufficientBalance",
        "inputs": [
            {
                "name": "sender",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "balance",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "needed",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC20InvalidApprover",
        "inputs": [
            {
                "name": "approver",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC20InvalidReceiver",
        "inputs": [
            {
                "name": "receiver",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC20InvalidSender",
        "inputs": [
            {
                "name": "sender",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC20InvalidSpender",
        "inputs": [
            {
                "name": "spender",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC2612ExpiredSignature",
        "inputs": [
            {
                "name": "deadline",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC2612InvalidSigner",
        "inputs": [
            {
                "name": "signer",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "owner",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC5805FutureLookup",
        "inputs": [
            {
                "name": "timepoint",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "clock",
                "type": "uint48",
                "internalType": "uint48"
            }
        ]
    },
    {
        "type": "error",
        "name": "ERC6372InconsistentClock",
        "inputs": []
    },
    {
        "type": "error",
        "name": "InvalidAccountNonce",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "currentNonce",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "InvalidInitialization",
        "inputs": []
    },
    {
        "type": "error",
        "name": "NotInitializing",
        "inputs": []
    },
    {
        "type": "error",
        "name": "OwnableInvalidOwner",
        "inputs": [
            {
                "name": "owner",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "OwnableUnauthorizedAccount",
        "inputs": [
            {
                "name": "account",
                "type": "address",
                "internalType": "address"
            }
        ]
    },
    {
        "type": "error",
        "name": "SafeCastOverflowedUintDowncast",
        "inputs": [
            {
                "name": "bits",
                "type": "uint8",
                "internalType": "uint8"
            },
            {
                "name": "value",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "VotesExpiredSignature",
        "inputs": [
            {
                "name": "expiry",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    }
] as const
