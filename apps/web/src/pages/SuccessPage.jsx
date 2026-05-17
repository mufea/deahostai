import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTransactionStatus() {
      if (!orderId) {
        setLoading(false);
        setError('No order ID provided.');
        return;
      }

      try {
        const response = await apiServerClient.fetch(`/midtrans/transaction-status/${orderId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction status');
        }

        const data = await response.json();
        setTransaction(data);
      } catch (error) {
        console.error('Failed to fetch transaction:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactionStatus();
  }, [orderId]);

  return (
    <>
      <Helmet>
        <title>Subscription Activated - AI SaaS Platform</title>
        <meta name="description" content="Your payment was successful. Thank you for subscribing." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Subscription Activated!</CardTitle>
            <CardDescription>Thank you for subscribing to AI SaaS Platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Verifying payment status...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive">{error}</p>
            ) : transaction ? (
              <div className="space-y-3 text-sm bg-muted/50 p-4 rounded-xl">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize text-primary">{transaction.status}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono text-xs">{transaction.order_id}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium uppercase">{transaction.payment_method || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">Rp {parseInt(transaction.gross_amount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No payment information available</p>
            )}

            <div className="pt-2">
              <Button asChild className="w-full">
                <Link to="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}