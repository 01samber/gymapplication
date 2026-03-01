-- ================================================================
-- SUBSCRIPTION PAYMENTS
-- ================================================================
-- Secure payment tracking: cash, card, bank_transfer, other
-- NO card numbers stored - only method + amount for audit trail
-- ================================================================

CREATE TYPE payment_method_type AS ENUM ('cash', 'card', 'bank_transfer', 'other');

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount_usd DECIMAL(10,2) NOT NULL CHECK (amount_usd > 0),
    payment_method payment_method_type NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id
    ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paid_at
    ON subscription_payments(paid_at DESC);

-- Enable RLS
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Admin can insert/select all (for recording renewals)
CREATE POLICY "subscription_payments_admin_all" ON subscription_payments
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Clients can SELECT only their own payments (via subscription -> client_id)
CREATE POLICY "subscription_payments_client_select" ON subscription_payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.id = subscription_payments.subscription_id
            AND s.client_id = auth.uid()
        )
    );
