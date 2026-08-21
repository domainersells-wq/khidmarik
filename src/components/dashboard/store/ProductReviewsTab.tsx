'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { 
  Star, MessageSquare, AlertTriangle, ShieldCheck, Flag, 
  CornerDownRight, Plus, Image as ImageIcon, Video, Trash2, Check, ExternalLink 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductItem, ProductReview, OrderItem } from '@/types';

// Mock reviews data initially
const mockReviews: ProductReview[] = [
  {
    id: 'rev-1',
    productId: 'prod1',
    orderId: 'ord-1022',
    authorName: 'Yassine M.',
    rating: 5,
    aspects: { product: 5, seller: 5, shipping: 4, packaging: 5, quality: 5 },
    comment: 'Exceptional quality olive oil! Very well packed, and the shipping was fast. Highly recommend this seller.',
    mediaUrls: ['https://placehold.co/100x100.png?text=Olive+Oil+Pic'],
    isVerified: true,
    sellerReply: 'Thank you for your warm words, Yassine! We work hard to bring the best Algerian olive oil.',
    reported: false,
    date: '2026-07-01T12:00:00.000Z'
  },
  {
    id: 'rev-2',
    productId: 'prod2',
    orderId: 'ord-1023',
    authorName: 'Faten K.',
    rating: 3,
    aspects: { product: 3, seller: 4, shipping: 2, packaging: 3, quality: 3 },
    comment: 'The handcrafted ceramic set is beautiful, but the shipping took too long to arrive in Oran.',
    mediaUrls: [],
    isVerified: true,
    reported: false,
    date: '2026-07-03T15:30:00.000Z'
  }
];

export function ProductReviewsTab() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<OrderItem[]>([]);
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  
  // Create review dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [generalRating, setGeneralRating] = useState(5);
  const [ratingProduct, setRatingProduct] = useState(5);
  const [ratingSeller, setRatingSeller] = useState(5);
  const [ratingShipping, setRatingShipping] = useState(5);
  const [ratingPackaging, setRatingPackaging] = useState(5);
  const [ratingQuality, setRatingQuality] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  
  // Reply modal states
  const [replyingReview, setReplyingReview] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  // Load reviews, products, and orders
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('/api/store/reviews');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setReviews(json.data);
        } else {
          const stored = localStorage.getItem('khidmatik_product_reviews');
          if (stored) setReviews(JSON.parse(stored));
          else setReviews(mockReviews);
        }
      } catch (e) {
        const stored = localStorage.getItem('khidmatik_product_reviews');
        if (stored) setReviews(JSON.parse(stored));
        else setReviews(mockReviews);
      }
    }
    fetchReviews();

    // Products
    const storedProds = localStorage.getItem('khidmatik_products_catalog');
    if (storedProds) {
      try { setProducts(JSON.parse(storedProds)); } catch (e) {}
    }

    // Orders to verify delivered ones
    const storedOrders = localStorage.getItem('khidmatik_store_orders');
    if (storedOrders) {
      try {
        const parsed: OrderItem[] = JSON.parse(storedOrders);
        setDeliveredOrders(parsed.filter(o => o.status === 'delivered' || o.status === 'completed'));
      } catch (e) {}
    }
  }, []);

  const saveReviews = async (updated: ProductReview[]) => {
    setReviews(updated);
    localStorage.setItem('khidmatik_product_reviews', JSON.stringify(updated));
    try {
      await fetch('/api/store/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: updated })
      });
    } catch (e) {}
  };

  // Submit Review Action (Buyer perspective simulation)
  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !reviewComment) return;

    const matchedOrder = deliveredOrders.find(o => o.id === selectedOrder);
    if (!matchedOrder) return;

    // Resolve matching product ID or default to 'prod1'
    const finalProductId = matchedOrder.productName.toLowerCase().includes('ceramic') ? 'prod2' : 'prod1';

    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      productId: finalProductId,
      orderId: selectedOrder,
      authorName: matchedOrder.customerName,
      rating: generalRating,
      aspects: {
        product: ratingProduct,
        seller: ratingSeller,
        shipping: ratingShipping,
        packaging: ratingPackaging,
        quality: ratingQuality
      },
      comment: reviewComment,
      mediaUrls: reviewImage ? [reviewImage] : [],
      isVerified: true,
      reported: false,
      date: new Date().toISOString()
    };

    const updated = [newReview, ...reviews];
    saveReviews(updated);
    setIsCreateOpen(false);

    // Reset fields
    setSelectedOrder('');
    setReviewComment('');
    setReviewImage('');
    setGeneralRating(5);

    toast({
      title: "Review Submitted",
      description: "Thank you! Your verified purchase feedback has been published."
    });
  };

  // Reply Review Action (Seller/Merchant perspective)
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText) return;

    const updated = reviews.map(r => {
      if (r.id === replyingReview.id) {
        return { ...r, sellerReply: replyText };
      }
      return r;
    });

    saveReviews(updated);
    setIsReplyOpen(false);
    setReplyText('');
    setReplyingReview(null);

    toast({
      title: "Response Published",
      description: "Your reply has been successfully added to this customer review."
    });
  };

  // Toggle reported review
  const handleReportReview = (id: string) => {
    const updated = reviews.map(r => {
      if (r.id === id) {
        toast({
          title: r.reported ? "Flag Removed" : "Review Flagged",
          description: r.reported ? "The review report status was reset." : "This review was marked for administrator inspection."
        });
        return { ...r, reported: !r.reported };
      }
      return r;
    });
    saveReviews(updated);
  };

  // Delete review
  const handleDeleteReview = (id: string) => {
    const updated = reviews.filter(r => r.id !== id);
    saveReviews(updated);
    toast({ title: "Review Deleted", description: "Review has been removed from catalog." });
  };

  // Mock Upload image URI conversion
  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filters logic
  const filteredReviews = reviews.filter(r => {
    if (selectedProductFilter === 'all') return true;
    return r.productId === selectedProductFilter;
  });

  const getAverageRating = () => {
    if (filteredReviews.length === 0) return 0;
    const sum = filteredReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return Number((sum / filteredReviews.length).toFixed(1));
  };

  const getAspectAverage = (aspect: keyof ProductReview['aspects']) => {
    if (filteredReviews.length === 0) return 0;
    const sum = filteredReviews.reduce((acc, curr) => acc + (curr.aspects[aspect] || 0), 0);
    return Number((sum / filteredReviews.length).toFixed(1));
  };

  const totalReviewsCount = filteredReviews.length;
  const averageRating = getAverageRating();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <MessageSquare className="h-8 w-8 text-primary" /> Product Reviews & Star Ratings
          </h1>
          <p className="text-muted-foreground text-sm">Analyze client ratings, moderate spam flags, and publish seller response updates.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Write a Review Simulator Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 text-xs">
                <Plus className="h-4 w-4" /> Simulate Client Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border text-slate-800 text-xs">
              <form onSubmit={handleCreateReview} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Write Verified Product Review</DialogTitle>
                  <DialogDescription>Submit verified review simulation from completed customer transactions.</DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="order-select">Select Completed Order *</Label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder} required>
                    <SelectTrigger id="order-select">
                      <SelectValue placeholder="Choose order..." />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {deliveredOrders.map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.customerName} - {o.productName} ({o.id})
                        </SelectItem>
                      ))}
                      {deliveredOrders.length === 0 && (
                        <SelectItem value="none" disabled>No delivered order entries found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>General Score (1-5)</Label>
                    <Input type="number" min="1" max="5" value={generalRating} onChange={e => setGeneralRating(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Product Quality Score</Label>
                    <Input type="number" min="1" max="5" value={ratingProduct} onChange={e => setRatingProduct(Number(e.target.value))} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label>Seller Service</Label>
                    <Input type="number" min="1" max="5" value={ratingSeller} onChange={e => setRatingSeller(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Shipping Speed</Label>
                    <Input type="number" min="1" max="5" value={ratingShipping} onChange={e => setRatingShipping(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Packaging Quality</Label>
                    <Input type="number" min="1" max="5" value={ratingPackaging} onChange={e => setRatingPackaging(Number(e.target.value))} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="rev-text">Comment Review *</Label>
                  <Textarea id="rev-text" required placeholder="Write your review description here..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} />
                </div>

                <div className="grid gap-1.5">
                  <Label>Attach Image Proof</Label>
                  <input type="file" accept="image/*" onChange={handleReviewImageChange} className="text-xs" />
                  {reviewImage && (
                    <img src={reviewImage} alt="Attachment preview" className="h-16 w-16 border rounded object-cover mt-1" />
                  )}
                </div>

                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit">Submit Review</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Overview and Aspect Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Star average card */}
        <Card className="shadow border bg-card">
          <CardHeader className="p-4 pb-2"><CardDescription>Total Rating Score</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0 text-center flex flex-col justify-center items-center">
            <div className="text-5xl font-extrabold text-amber-500 font-mono tracking-tighter flex items-center gap-1">
              {averageRating} <Star className="h-7 w-7 fill-amber-500 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Calculated from {totalReviewsCount} customer ratings</p>
          </CardContent>
        </Card>

        {/* Aspects Average */}
        <Card className="col-span-2 shadow border bg-card">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold">Aspect Grading Parameters</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-2 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>Product Quality & Specs</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{getAspectAverage('product')}/5</span>
              </div>
              <Progress value={(getAspectAverage('product') / 5) * 100} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>Seller Response & service</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{getAspectAverage('seller')}/5</span>
              </div>
              <Progress value={(getAspectAverage('seller') / 5) * 100} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>Shipping & Delivery Timeliness</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{getAspectAverage('shipping')}/5</span>
              </div>
              <Progress value={(getAspectAverage('shipping') / 5) * 100} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span>Packaging Density & Safety</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{getAspectAverage('packaging')}/5</span>
              </div>
              <Progress value={(getAspectAverage('packaging') / 5) * 100} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Moderate List */}
      <Card className="shadow border bg-card">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg">Customer Review Logs</CardTitle>
            <CardDescription>Filter reviews by item or moderate details.</CardDescription>
          </div>
          <Select value={selectedProductFilter} onValueChange={setSelectedProductFilter}>
            <SelectTrigger className="w-full sm:w-60 h-9 text-xs">
              <SelectValue placeholder="All products reviews" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Products</SelectItem>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {filteredReviews.map((rev) => {
            const productRef = products.find(p => p.id === rev.productId);
            return (
              <div key={rev.id} className="p-4 border dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/10 space-y-3 text-xs">
                {/* Title line */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{rev.authorName}</span>
                    {rev.isVerified && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50 flex items-center gap-0.5 text-[9px] font-bold">
                        <ShieldCheck className="h-3 w-3" /> Verified Purchase
                      </Badge>
                    )}
                    {rev.reported && (
                      <Badge variant="destructive" className="flex items-center gap-0.5 text-[9px] font-bold">
                        <AlertTriangle className="h-3 w-3" /> Flagged Spam
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span>Order: {rev.orderId}</span>
                    <span>•</span>
                    <span>{new Date(rev.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="flex items-center gap-0.5 font-bold text-amber-500">
                    General: {rev.rating} <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  </span>
                  <span className="text-muted-foreground">Product: {rev.aspects.product || 0}/5</span>
                  <span className="text-muted-foreground">Seller: {rev.aspects.seller || 0}/5</span>
                  <span className="text-muted-foreground">Shipping: {rev.aspects.shipping || 0}/5</span>
                  <span className="text-muted-foreground">Packaging: {rev.aspects.packaging || 0}/5</span>
                </div>

                {/* Product label */}
                {productRef && (
                  <p className="text-muted-foreground text-[10px] font-semibold flex items-center gap-1">
                    Product: <span className="text-slate-700 dark:text-slate-300 underline">{productRef.name}</span>
                  </p>
                )}

                {/* Comment body */}
                <p className="text-slate-800 dark:text-slate-300 italic text-sm py-1 bg-white dark:bg-slate-950/30 p-2.5 rounded border dark:border-slate-800">{rev.comment}</p>

                {/* Photo attachments */}
                {rev.mediaUrls && rev.mediaUrls.length > 0 && (
                  <div className="flex gap-2">
                    {rev.mediaUrls.map((url, index) => (
                      <div key={index} className="relative h-14 w-14 border rounded overflow-hidden">
                        <img src={url} alt="Review attachment" className="object-cover h-full w-full" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Merchant Reply if exists */}
                {rev.sellerReply && (
                  <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border-l-4 border-primary mt-2 flex items-start gap-2">
                    <CornerDownRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-primary text-[10px]">Seller Response (الرد الترويجي للبائع)</p>
                      <p className="text-slate-700 dark:text-slate-300 italic">{rev.sellerReply}</p>
                    </div>
                  </div>
                )}

                {/* Moderator Control actions */}
                <div className="flex justify-end gap-1.5 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[10px]"
                    onClick={() => {
                      setReplyingReview(rev);
                      setReplyText(rev.sellerReply || '');
                      setIsReplyOpen(true);
                    }}
                  >
                    {rev.sellerReply ? 'Edit Reply' : 'Reply Review'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleReportReview(rev.id)}
                    className={`h-7 text-[10px] ${rev.reported ? 'text-yellow-600 border-yellow-200' : 'text-slate-500'}`}
                  >
                    <Flag className="h-3 w-3 mr-1" /> {rev.reported ? 'Unflag Review' : 'Report Abuse'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteReview(rev.id)}
                    className="h-7 text-[10px] text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
          {filteredReviews.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No client reviews registered for this filter.</p>
          )}
        </CardContent>
      </Card>

      {/* Seller Reply Dialog */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-md bg-white border text-slate-800 text-xs">
          {replyingReview && (
            <form onSubmit={handleReplySubmit}>
              <DialogHeader>
                <DialogTitle>Reply to {replyingReview.authorName}'s Review</DialogTitle>
                <DialogDescription>Your reply will be displayed publicly below their comment review.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 text-slate-800">
                <div className="bg-slate-100 p-2.5 rounded border italic text-muted-foreground">
                  "{replyingReview.comment}"
                </div>
                <div className="grid gap-1.5 text-xs">
                  <Label htmlFor="reply-text">Seller Response Message</Label>
                  <Textarea 
                    id="reply-text" 
                    required 
                    placeholder="Dear customer, thank you for choosing our store..." 
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)} 
                    rows={4} 
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Publish Response</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
