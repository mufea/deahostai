import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <>
      <Helmet>
        <title>Payment Cancelled - AI SaaS Platform</title>
        <meta name="description" content="Your payment was cancelled or failed." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md bg-card text-card-foreground">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
            <CardDescription>Payment was cancelled or failed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              No charges were made to your account. You can try again anytime.
            </p>

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to="/subscription">Retry Payment</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}