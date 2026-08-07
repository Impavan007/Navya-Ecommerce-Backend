import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order, { IOrderProduct } from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Cart from '../models/Cart';

// Customer create order: POST /api/v1/renter/create-order
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { products, address } = req.body;
    if (!products || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products in order' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Retrieve address details from user's profile
    const selectedAddress = user.addresses.find(addr => addr._id!.toString() === address || addr.is_primary);
    const addressStr = selectedAddress
      ? JSON.stringify(selectedAddress)
      : JSON.stringify({ label: 'Shipping', street_name: 'Standard Street', house_number: '1', city: 'City', postal_code: '123456', country: 'Country' });

    const transactionId = 'tx_' + Math.random().toString(36).substr(2, 9);

    // Group products by seller (lender) to split orders
    const productsByLender: Record<string, any[]> = {};
    for (const item of products) {
      const prod = await Product.findById(item.product);
      if (!prod) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }

      if (prod.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for product: ${prod.name}` });
      }

      const lenderId = prod.lender.toString();
      if (!productsByLender[lenderId]) {
        productsByLender[lenderId] = [];
      }

      productsByLender[lenderId].push({
        product: prod,
        quantity: item.quantity,
        size: item.size
      });
    }

    const createdOrders = [];
    let grandTotal = 0;
    let totalRentalFees = 0;

    for (const [lenderId, items] of Object.entries(productsByLender)) {
      const orderProducts: IOrderProduct[] = [];
      let rentalFeeTotal = 0;

      for (const item of items) {
        const prod = item.product;
        const subtotal = prod.price * item.quantity;
        rentalFeeTotal += subtotal;

        orderProducts.push({
          product: prod._id,
          lender: prod.lender,
          quantity: item.quantity,
          size: item.size,
          start_date: '',
          end_date: '',
          duration: 1,
          rental_price_per_day: prod.price,
          cleaning_fee: 0,
          security_deposit: 0,
          subtotal
        });

        // Decrement product inventory stock
        prod.quantity -= item.quantity;
        await prod.save();
      }

      const platformFee = rentalFeeTotal * 0.05; // 5% fee
      const totalPrice = rentalFeeTotal + platformFee;
      totalRentalFees += rentalFeeTotal;
      grandTotal += totalPrice;

      const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const order = new Order({
        order_number: orderNumber,
        order_slug_id: orderNumber,
        renter: req.user.id,
        lender: lenderId,
        products: orderProducts,
        rental_fee_total: rentalFeeTotal,
        cleaning_fee_total: 0,
        security_deposit_total: 0,
        platform_fee: platformFee,
        earnings: rentalFeeTotal - platformFee, // seller earnings after commission
        shipping_charge: 0,
        total_price: totalPrice,
        status: 'Placed',
        address: addressStr,
        transaction: transactionId,
        timeline: [{
          title: 'Order Placed',
          by: req.user.id,
          note: 'Your order was successfully created.',
          date: new Date().toISOString()
        }]
      });

      await order.save();
      createdOrders.push(order);
    }

    // Clear user's cart
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });

    return res.status(201).json({
      success: true,
      data: {
        orders: createdOrders,
        totalOrders: createdOrders.length,
        grandTotal,
        pricing: {
          rentalFees: totalRentalFees,
          cleaningFees: 0,
          platformFees: totalRentalFees * 0.05,
          securityDeposits: 0,
          finalTotal: grandTotal
        },
        transaction: {
          id: transactionId,
          amount: grandTotal,
          status: 'success'
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/renter/create-checkout-session/:transactionId
export const createCheckoutSession = async (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      sessionId: 'session_mock_' + Math.random().toString(36).substr(2, 9),
      sessionUrl: req.body.successUrl || 'http://localhost:3001/payment/success',
      paymentAmount: 100,
      currency: 'INR',
      includeSecurityDeposit: false,
      metadata: { transactionId: req.params.transactionId, orderCount: 1, customerId: 'mock_cus' }
    }
  });
};

// Customer retrieve orders list: GET /api/v1/renter/my-bookings
export const getRenterBookings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { status, search } = req.query;
    const query: any = { renter: req.user.id };

    if (status && status !== 'all') {
      query.status = status.toString();
    }

    const orders = await Order.find(query)
      .populate('products.product')
      .sort({ createdAt: -1 });

    const formattedBookings = [];
    for (const order of orders) {
      for (const item of order.products) {
        const prod = item.product as any;
        if (!prod) continue;

        formattedBookings.push({
          orderId: order._id,
          orderInternalId: order._id,
          productId: prod._id,
          productName: prod.name,
          productImage: prod.cover_image,
          size: item.size,
          price: prod.price,
          itemCount: item.quantity,
          rentalPeriod: '1 item',
          status: (order.status === 'Placed' || order.status === 'Pending') ? 'Placed Order' : order.status,
          reviewAvailable: order.status === 'Completed',
          reviewText: '',
          createdAt: order.createdAt,
          totalAmount: order.total_price,
          rentalFee: order.rental_fee_total,
          cleaningFee: 0,
          securityDeposit: 0,
          trackingNumber: null,
          trackingLink: null,
          shippingProvider: null,
          lenderId: order.lender
        });
      }
    }

    return res.json({
      success: true,
      data: {
        bookings: formattedBookings
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Customer retrieve single order details: GET /api/v1/bookings/:id
export const getRenterBookingDetail = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product')
      .populate('renter', 'name email phone profile_image')
      .populate('lender', 'name email profile_image');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const firstProduct = order.products[0];
    const productInfo = firstProduct?.product as any;
    const renterInfo = order.renter as any;
    const lenderInfo = order.lender as any;

    let parsedAddress = null;
    try {
      parsedAddress = order.address ? JSON.parse(order.address) : null;
    } catch {
      parsedAddress = { street_name: order.address, city: '', postal_code: '' };
    }

    const formattedDetail = {
      _id: order._id,
      orderNumber: order.order_number,
      productName: productInfo?.name || 'Product',
      productImage: productInfo?.cover_image || '/assets/product-1.jpg',
      productId: productInfo?._id,
      size: firstProduct?.size || 'M',
      price: productInfo?.price || 0,
      rentalPeriod: `${firstProduct?.quantity || 1} item(s)`,
      currentStatus: (order.status === 'Placed' || order.status === 'Pending') ? 'Placed Order' : order.status,
      seller: lenderInfo?.name || 'seller',
      sellerImage: lenderInfo?.profile_image || null,
      lenderDetails: lenderInfo,
      renterDetails: renterInfo,
      timeline: order.timeline,
      deliveryDetails: {
        deliverTo: renterInfo?.name || 'Customer',
        address: parsedAddress ? `${parsedAddress.house_number || ''} ${parsedAddress.street_name || ''}, ${parsedAddress.city || ''}, ${parsedAddress.postal_code || ''}`.trim() : order.address
      },
      priceDetails: {
        price: order.rental_fee_total,
        securityDeposit: 0,
        cleaningFee: 0,
        serviceCharges: order.platform_fee,
        totalAmount: order.total_price
      },
      reviewAvailable: order.status === 'Completed'
    };

    return res.json({
      success: true,
      data: formattedDetail
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// seller list orders: GET /api/v1/lender/orders
export const getLenderOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { status, search } = req.query;
    const query: any = { lender: req.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('products.product')
      .populate('renter', 'name email phone profile_image')
      .sort({ createdAt: -1 });

    const statusCounts = { all: orders.length, pending: 0, confirmed: 0, shipped: 0, delivered: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      const sKey = o.status.toLowerCase() as keyof typeof statusCounts;
      if (statusCounts[sKey] !== undefined) statusCounts[sKey]++;
    });

    return res.json({
      success: true,
      data: {
        orders,
        statusSummary: statusCounts
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// seller update order status: POST /api/v1/lender/orders/:orderId/status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, note, tracking_number, tracking_link, shipping_provider } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;

    // Add event to order timeline
    order.timeline.push({
      title: `Status Updated to ${status}`,
      by: req.user?.id || 'System',
      note: note || `Order marked as ${status}.`,
      date: new Date().toISOString()
    });

    // If shipped, inject mock tracking details
    if (status === 'Shipped' && tracking_number) {
      order.address = JSON.stringify({
        ...JSON.parse(order.address),
        tracking_number,
        tracking_link,
        shipping_provider
      });
    }

    await order.save();
    return res.json({ success: true, message: `Order status updated to ${status}`, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Customer confirm delivery POST /api/v1/renter/confirm-delivery/:id
export const confirmDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'Completed';
    order.timeline.push({
      title: 'Delivery Confirmed',
      by: req.user?.id || 'Customer',
      note: req.body.note || 'Renter confirmed delivery and inspected items.',
      date: new Date().toISOString()
    });

    await order.save();
    return res.json({ success: true, message: 'Delivery confirmed and order completed.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Customer cancel order POST /api/v1/renter/cancel-order/:id
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'Placed') {
      return res.status(400).json({ success: false, message: 'Only placed orders can be cancelled.' });
    }

    order.status = 'Cancelled';
    order.timeline.push({
      title: 'Order Cancelled',
      by: req.user?.id || 'Customer',
      note: req.body.reason || 'Cancelled by customer.',
      date: new Date().toISOString()
    });

    // Restore stock levels
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    }

    await order.save();
    return res.json({ success: true, message: 'Order cancelled successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mock return order POST /api/v1/renter/return-order/:id (standard e-commerce refund/return request)
export const returnOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'Returned';
    order.timeline.push({
      title: 'Return Initiated',
      by: req.user?.id || 'Customer',
      note: req.body.description || 'Items return requested.',
      date: new Date().toISOString()
    });

    await order.save();
    return res.json({ success: true, message: 'Return initiated successfully.', data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// seller responds to extension request POST /api/v1/lender/orders/:orderId/extension/respond
export const respondExtension = (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Mock extension response recorded successfully.'
  });
};

// Tracking info lookup GET /api/v1/renter/my-bookings/:id/tracking
export const getTrackingInfo = async (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      trackingNumber: 'TRK_' + Math.random().toString(36).substr(2, 9),
      carrier: 'DHL Express',
      shippedAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 172800000).toISOString(), // + 2 days
      timeline: [
        { status: 'Shipped', note: 'Handed over to carrier', date: new Date().toISOString() },
        { status: 'In Transit', note: 'Arrived at hub', date: new Date(Date.now() + 3600000).toISOString() }
      ]
    }
  });
};
