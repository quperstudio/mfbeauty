/*
  # Add Immutability Model to Transactions Table

  1. Purpose
    - Implement immutability pattern for financial transactions
    - Transactions are NEVER deleted, only reversed
    - Maintain complete audit trail for financial integrity

  2. New Columns
    - is_reversal (boolean) - Whether this transaction reverses another
    - reverses_transaction_id (uuid) - Links to the transaction being reversed
    - reversed_by_transaction_id (uuid) - Links to the reversal transaction (if this was reversed)
    - updated_at (timestamptz) - Track minor updates (like notes, not amounts)
    - updated_by (uuid) - User who made the update

  3. Business Rules
    - Transactions cannot be deleted (enforced by application logic)
    - To "cancel" a transaction, create a reversal transaction
    - Reversal transactions have opposite type and negative amount
    - Original and reversal transactions are linked bidirectionally

  4. Indexes
    - Index on reverses_transaction_id for finding reversals
    - Index on is_reversal for filtering regular vs reversal transactions
*/

-- Add new columns for immutability pattern
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_reversal') THEN
    ALTER TABLE transactions ADD COLUMN is_reversal boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'reverses_transaction_id') THEN
    ALTER TABLE transactions ADD COLUMN reverses_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'reversed_by_transaction_id') THEN
    ALTER TABLE transactions ADD COLUMN reversed_by_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'updated_at') THEN
    ALTER TABLE transactions ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'updated_by') THEN
    ALTER TABLE transactions ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_reverses ON transactions(reverses_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reversed_by ON transactions(reversed_by_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_reversal ON transactions(organization_id, is_reversal);

-- Add constraint to ensure reversal transactions reference valid transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_reversal_has_reference'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT check_reversal_has_reference 
    CHECK (
      (is_reversal = false AND reverses_transaction_id IS NULL) OR
      (is_reversal = true AND reverses_transaction_id IS NOT NULL)
    );
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN transactions.is_reversal IS 'True if this transaction reverses another transaction';
COMMENT ON COLUMN transactions.reverses_transaction_id IS 'ID of the transaction being reversed (if this is a reversal)';
COMMENT ON COLUMN transactions.reversed_by_transaction_id IS 'ID of the reversal transaction (if this transaction was reversed)';
COMMENT ON TABLE transactions IS 'Financial transactions - IMMUTABLE: Never delete, only create reversals';
