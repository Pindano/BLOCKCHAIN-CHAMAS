"use client";
import { useSendEvmTransaction, useEvmAddress } from "@coinbase/cdp-hooks";
import { Button } from "@coinbase/cdp-react/components/Button";
import { LoadingSkeleton } from "@coinbase/cdp-react/components/LoadingSkeleton";
import { type MouseEvent, useCallback, useMemo, useState } from "react";

interface Props {
  balance?: string;
  onSuccess?: () => void;
}

export default function Transaction(props: Props) {
  const { balance, onSuccess } = props;
  const { sendEvmTransaction } = useSendEvmTransaction();
  const { evmAddress } = useEvmAddress();

  const [isPending, setIsPending] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleSendTransaction = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      if (!evmAddress) return;

      e.preventDefault();
      setIsPending(true);

      const { transactionHash } = await sendEvmTransaction({
        transaction: {
          to: evmAddress,              // Send to yourself for testing
          value: 1000000000000n,       // 0.000001 ETH in wei
          gas: 21000n,                 // Standard ETH transfer gas limit
          chainId: 84532,              // Base Sepolia testnet
          type: "eip1559",             // Modern transaction type
        },
        evmAccount: evmAddress,
        network: "base-sepolia",
      });

      setTransactionHash(transactionHash);
      setIsPending(false);
      onSuccess?.();
    },
    [evmAddress, sendEvmTransaction, onSuccess],
  );

  // Component renders transaction button or success state
  return (
    <Button onClick={handleSendTransaction} isPending={isPending}>
      Send Transaction
    </Button>
  );
}
