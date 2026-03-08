import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  AlertTriangle,
  Bike
} from 'lucide-react';
import type { PendingDeliveryOrder } from '@/hooks/useDeliveryNotifications';

interface NewOrderAlertProps {
  open: boolean;
  orders: PendingDeliveryOrder[];
  onAccept: (orderId: string) => void;
  onDismiss: () => void;
  isAccepting: boolean;
  cutoffSeconds: number;
}

const NewOrderAlert: React.FC<NewOrderAlertProps> = ({
  open,
  orders,
  onAccept,
  onDismiss,
  isAccepting,
  cutoffSeconds,
}) => {
  if (orders.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-0 p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-6 pt-6 pb-5">
          <DialogTitle className="flex items-center gap-3 text-lg text-white">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce shadow-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="block">🚀 New Delivery Orders!</span>
              <span className="block text-xs font-normal text-white/80">Accept quickly to earn more</span>
            </div>
            <Badge className="ml-auto bg-white/25 text-white border-white/30 backdrop-blur-sm text-sm px-3 py-1">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {orders.map((order) => {
            const progressPercent = (order.seconds_remaining / cutoffSeconds) * 100;
            const isUrgent = order.seconds_remaining < 30;

            return (
              <Card 
                key={order.id} 
                className={`border-2 transition-all shadow-md ${
                  isUrgent 
                    ? 'border-red-400 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20' 
                    : 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-cyan-50/50 dark:from-emerald-950/20 dark:to-cyan-950/10'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">#{order.order_number}</span>
                      <Badge className="capitalize text-xs bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
                        {order.service_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      ₹{order.total_amount}
                    </span>
                  </div>

                  {/* Customer Info */}
                  {order.customer && (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30">
                      <p className="font-semibold text-sm">👤 {order.customer.name}</p>
                      <a 
                        href={`tel:${order.customer.mobile_number}`} 
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5"
                      >
                        <Phone className="h-3 w-3" />
                        {order.customer.mobile_number}
                      </a>
                    </div>
                  )}

                  {/* Address */}
                  {order.delivery_address && (
                    <div className="flex items-start gap-2 text-sm p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                      <span className="line-clamp-2 text-amber-900 dark:text-amber-200">{order.delivery_address}</span>
                    </div>
                  )}

                  {/* Countdown Timer */}
                  <div className="space-y-1.5 p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground font-medium">
                        <Clock className="h-3 w-3" />
                        ⏱ Time to accept
                      </span>
                      <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
                        {Math.floor(order.seconds_remaining / 60)}:{(order.seconds_remaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <Progress 
                      value={progressPercent} 
                      className={`h-2.5 rounded-full ${isUrgent ? '[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500' : '[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500'}`}
                    />
                    {isUrgent && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="h-3 w-3" />
                        ⚡ Accept quickly before time runs out!
                      </p>
                    )}
                  </div>

                  {/* Accept Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-emerald-500/25 border-0 text-base font-semibold" 
                    size="lg"
                    onClick={() => onAccept(order.id)}
                    disabled={isAccepting}
                  >
                    <Bike className="h-5 w-5 mr-2" />
                    🏍️ Accept Delivery
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderAlert;
