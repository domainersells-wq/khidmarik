'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, Truck, Calculator, HelpCircle, Check, 
  Settings, Key, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { algerianWilayas } from '@/data/algerian-wilayas';

interface ShippingRate {
  wilayaId: string;
  wilayaName: string;
  deskRate: number;
  homeRate: number;
  isActive: boolean;
}

const initialRates: ShippingRate[] = [
  { wilayaId: '16', wilayaName: 'Algiers', deskRate: 350, homeRate: 500, isActive: true },
  { wilayaId: '31', wilayaName: 'Oran', deskRate: 450, homeRate: 650, isActive: true },
  { wilayaId: '25', wilayaName: 'Constantine', deskRate: 450, homeRate: 650, isActive: true },
  { wilayaId: '09', wilayaName: 'Blida', deskRate: 350, homeRate: 550, isActive: true },
  { wilayaId: '19', wilayaName: 'Sétif', deskRate: 500, homeRate: 700, isActive: true },
];

export function DeliverySettingsSection() {
  const { toast } = useToast();
  const [rates, setRates] = useState<ShippingRate[]>(initialRates);
  const [activeTab, setActiveTab] = useState<'rates' | 'carriers' | 'calculator'>('rates');

  // Calculator state
  const [calcWilaya, setCalcWilaya] = useState('16');
  const [calcType, setCalcType] = useState<'home' | 'desk'>('home');
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcCost, setCalcCost] = useState<number | null>(null);

  const calculateCost = () => {
    const baseDesk = 350;
    const baseHome = 500;
    const rateMultiplier = Number(calcWilaya) > 30 ? 1.5 : 1.1; // Simulated premium for south/far wilayas
    const weightFee = Math.max(0, (calcWeight - 1) * 80); // 80 DA per extra kg
    
    let base = calcType === 'home' ? baseHome : baseDesk;
    const result = Math.round((base * rateMultiplier) + weightFee);
    setCalcCost(result);
    toast({
      title: 'Shipping Cost Calculated',
      description: `Yalidine estimated fee is ${result.toLocaleString()} DA.`,
    });
  };

  const updateRate = (id: string, type: 'desk' | 'home', val: number) => {
    setRates(rates.map(r => {
      if (r.wilayaId === id) {
        return { ...r, [type === 'desk' ? 'deskRate' : 'homeRate']: val };
      }
      return r;
    }));
  };

  const toggleWilaya = (id: string) => {
    setRates(rates.map(r => {
      if (r.wilayaId === id) {
        const nextActive = !r.isActive;
        toast({
          title: nextActive ? 'Wilaya Enabled' : 'Wilaya Suspended',
          description: `${r.wilayaName} shipping is now ${nextActive ? 'active' : 'paused'}.`,
        });
        return { ...r, isActive: nextActive };
      }
      return r;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" /> Delivery Settings (إعدادات التوصيل)
          </h1>
          <p className="text-muted-foreground">Set up domestic shipping fees for Algerian Wilayas, test courier calculators, and sync Yalidine API keys.</p>
        </div>
      </div>

      {/* Segmented control tabs */}
      <div className="flex border-b text-xs font-semibold gap-4">
        <button 
          className={`pb-2 px-1 border-b-2 ${activeTab === 'rates' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('rates')}
        >
          Wilaya Shipping Rates
        </button>
        <button 
          className={`pb-2 px-1 border-b-2 ${activeTab === 'carriers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('carriers')}
        >
          Carrier Contracts & API
        </button>
        <button 
          className={`pb-2 px-1 border-b-2 ${activeTab === 'calculator' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('calculator')}
        >
          Yalidine Rate Calculator
        </button>
      </div>

      {activeTab === 'rates' && (
        <Card className="shadow border">
          <CardHeader className="p-4"><CardTitle className="text-base">Custom Wilaya Rates Matrix</CardTitle>
            <CardDescription>Adjust the rates for your default delivery destinations. Rates sync with customer checkout.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wilaya Code</TableHead>
                  <TableHead>Destination Wilaya</TableHead>
                  <TableHead className="w-[150px] text-right">Stop Desk Payout (DA)</TableHead>
                  <TableHead className="w-[150px] text-right">Home Delivery Payout (DA)</TableHead>
                  <TableHead className="text-center w-[120px]">Shipping Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map(rate => (
                  <TableRow key={rate.wilayaId} className={!rate.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-xs font-bold text-slate-700">{rate.wilayaId}</TableCell>
                    <TableCell className="font-semibold text-xs">{rate.wilayaName}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        className="text-right font-mono h-8 text-xs" 
                        value={rate.deskRate} 
                        onChange={e => updateRate(rate.wilayaId, 'desk', Number(e.target.value))}
                        disabled={!rate.isActive}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        className="text-right font-mono h-8 text-xs" 
                        value={rate.homeRate} 
                        onChange={e => updateRate(rate.wilayaId, 'home', Number(e.target.value))}
                        disabled={!rate.isActive}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={rate.isActive} 
                        onCheckedChange={() => toggleWilaya(rate.wilayaId)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="p-4 border-t bg-slate-50 flex justify-end">
            <Button size="sm" className="bg-primary text-white"><Check className="h-4 w-4 mr-1.5" /> Save Delivery Rates</Button>
          </CardFooter>
        </Card>
      )}

      {activeTab === 'carriers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow border md:col-span-2">
            <CardHeader className="p-4"><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-primary" /> Yalidine Courier API Integration</CardTitle>
              <CardDescription>Link your merchant warehouse contract to automate waybill generation.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="yaliId">Yalidine API Key ID *</Label>
                  <Input id="yaliId" placeholder="e.g. yali_902871120023" className="font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="yaliToken">Yalidine Secret Token *</Label>
                  <Input id="yaliToken" type="password" placeholder="••••••••••••••••••••••••" className="font-mono text-xs" />
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded border text-[10px] space-y-1">
                <p className="font-bold text-slate-700 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-yellow-600" /> Automatic Webhook Dispatch</p>
                <p className="text-muted-foreground">Orders marked "Ready to Ship" are instantly synced with Yalidine. You can download shipping PDF layouts directly from the orders page.</p>
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t flex justify-end gap-2">
              <Button size="sm" variant="outline" className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Test API Connection</Button>
              <Button size="sm" className="bg-primary text-white">Save API Credentials</Button>
            </CardFooter>
          </Card>

          <Card className="shadow border">
            <CardHeader className="p-4"><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Supported Couriers</CardTitle>
              <CardDescription>Enable or disable active carriers.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-bold">Yalidine Express</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Domestic courier coverage (58 Wilayas)</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-bold">EMS Algeria Post</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Official express post network</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">In-house / Local Rider</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Delivery agents managed by store</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'calculator' && (
        <Card className="shadow border max-w-xl">
          <CardHeader className="p-4"><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Delivery Fee Calculator</CardTitle>
            <CardDescription>Simulate shipping fee parameters based on Yalidine national pricing models.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="calcWilaya">Destination Wilaya *</Label>
                <Select value={calcWilaya} onValueChange={setCalcWilaya}>
                  <SelectTrigger id="calcWilaya">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-800 border">
                    {algerianWilayas.map(w => (
                      <SelectItem key={w.code} value={w.code}>{w.code} - {w.name_en || w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="calcType">Delivery Option *</Label>
                <Select value={calcType} onValueChange={(val: any) => setCalcType(val)}>
                  <SelectTrigger id="calcType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-800 border">
                    <SelectItem value="home">Home Delivery (توصيل للمنزل)</SelectItem>
                    <SelectItem value="desk">Yalidine Desk Collection (توصيل للمكتب)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="calcWeight">Parcel Weight (kg)</Label>
                <Input 
                  id="calcWeight" 
                  type="number" 
                  className="font-mono text-xs" 
                  value={calcWeight} 
                  onChange={e => setCalcWeight(Number(e.target.value))} 
                />
              </div>
            </div>

            {calcCost !== null && (
              <div className="bg-green-50/50 border border-green-200 p-3 rounded-md flex justify-between items-center">
                <span className="font-semibold text-green-800 text-xs">Estimated Yalidine Charge:</span>
                <span className="font-mono font-bold text-green-700 text-base">{calcCost.toLocaleString()} DA</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t flex justify-end">
            <Button onClick={calculateCost} className="bg-primary text-white flex items-center gap-1.5"><Calculator className="h-4 w-4" /> Calculate Shipping Fee</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
