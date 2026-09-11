'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Wallet, 
  Plus, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  CreditCard, 
  Sparkles, 
  Lock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Phone,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { formatDA } from '@/lib/utils';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  phone: string;
  monthlyLimit: number;
  spentThisMonth: number;
  allowEmergencySOS: boolean;
  avatarUrl?: string;
  status: 'active' | 'paused';
}

const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-01',
    name: 'سارة بن علي (الزوجة)',
    relation: 'الزوجة',
    phone: '0555 12 34 56',
    monthlyLimit: 25000,
    spentThisMonth: 8400,
    allowEmergencySOS: true,
    status: 'active',
  },
  {
    id: 'fam-02',
    name: 'ياسين بن علي (الابن)',
    relation: 'الابن (جامعة)',
    phone: '0770 98 76 54',
    monthlyLimit: 10000,
    spentThisMonth: 4200,
    allowEmergencySOS: true,
    status: 'active',
  },
  {
    id: 'fam-03',
    name: 'الحاج بلقاسم (الوالد)',
    relation: 'الوالد',
    phone: '0661 45 67 89',
    monthlyLimit: 15000,
    spentThisMonth: 2100,
    allowEmergencySOS: true,
    status: 'active',
  }
];

export function FamilyWalletManager() {
  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_FAMILY_MEMBERS);
  const [masterBalance, setMasterBalance] = useState(68500); // DA
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New member form state
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('الزوجة');
  const [newPhone, setNewPhone] = useState('');
  const [newLimit, setNewLimit] = useState(15000);
  const [newAllowEmergency, setNewAllowEmergency] = useState(true);

  const totalAllocated = members.reduce((sum, m) => sum + m.monthlyLimit, 0);
  const totalSpentThisMonth = members.reduce((sum, m) => sum + m.spentThisMonth, 0);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast({
        title: 'يرجى إدخال اسم ورقم هاتف فرد العائلة',
        variant: 'destructive',
      });
      return;
    }

    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: `${newName} (${newRelation})`,
      relation: newRelation,
      phone: newPhone,
      monthlyLimit: Number(newLimit) || 10000,
      spentThisMonth: 0,
      allowEmergencySOS: newAllowEmergency,
      status: 'active',
    };

    setMembers([...members, newMember]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    toast({
      title: 'تمت إضافة فرد العائلة بنجاح!',
      description: `تم ربط حساب ${newMember.name} بمحفظة العائلة وتعيين سقف شهري قدره ${newMember.monthlyLimit.toLocaleString()} DA.`,
    });
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    toast({
      title: 'تم حذف العضو من المحفظة المشتركة',
    });
  };

  const toggleEmergencySos = (id: string) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, allowEmergencySOS: !m.allowEmergencySOS } : m))
    );
    toast({
      title: 'تم تحديث صلاحية طلب طوارئ الحرفيين',
    });
  };

  return (
    <div className="space-y-6 text-right">
      {/* Wallet Banner */}
      <Card className="rounded-3xl border-2 border-primary/30 bg-gradient-to-l from-primary/20 via-primary/10 to-background p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>محفظة العائلة الذكية • Family Shared Ledger</span>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">
              الرصيد المشترك للأسرة
            </h2>
            <p className="text-xs text-muted-foreground">
              يتيح لأفراد العائلة طلب خدمات الصيانة المنزلية والطرود مع تحكم كامل في السقوف المالية دون الحاجة لمشاركة بيانات البطاقة الذهبية.
            </p>
          </div>

          <div className="bg-card border p-4 rounded-2xl text-center shrink-0 min-w-[220px] shadow-sm">
            <span className="text-xs text-muted-foreground block">رصيد الحساب الرئيسي المتاح:</span>
            <span suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-primary font-mono">
              {formatDA(masterBalance)} DA
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
              ✓ آمن ومحمي بنظام القيد المزدوج
            </span>
          </div>
        </div>

        {/* Global Consumption Progress */}
        <div className="mt-6 pt-4 border-t border-border/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold" suppressHydrationWarning>
            <span>إجمالي استهلاك العائلة هذا الشهر: {formatDA(totalSpentThisMonth)} DA</span>
            <span>المخصص الشهري الإجمالي: {formatDA(totalAllocated)} DA</span>
          </div>
          <Progress 
            value={totalAllocated > 0 ? (totalSpentThisMonth / totalAllocated) * 100 : 0} 
            className="h-2.5 bg-muted"
          />
        </div>
      </Card>

      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-primary-foreground font-bold rounded-xl text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          إضافة فرد جديد للعائلة
        </Button>
        <div>
          <h3 className="text-lg font-bold text-foreground">أفراد العائلة المسجلون</h3>
          <p className="text-xs text-muted-foreground">تحكم في الصلاحيات والسقوف الشهرية لكل فرد</p>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((member) => {
          const usagePercent = Math.round((member.spentThisMonth / member.monthlyLimit) * 100);
          return (
            <Card key={member.id} className="rounded-2xl border border-border shadow-sm p-5 space-y-4 text-right flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between flex-row-reverse">
                  <div className="flex items-center gap-2.5 flex-row-reverse">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                      {member.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{member.name}</h4>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                        <Phone className="h-3 w-3" /> {member.phone}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Spending Progress */}
                <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border">
                  <div className="flex justify-between text-xs font-semibold" suppressHydrationWarning>
                    <span className="text-muted-foreground">المستهلك:</span>
                    <span className="text-foreground font-mono">
                      {formatDA(member.spentThisMonth)} DA / {formatDA(member.monthlyLimit)} DA
                    </span>
                  </div>
                  <Progress value={usagePercent} className="h-2 bg-muted" />
                  <span className="text-[10px] text-muted-foreground block text-left font-mono">
                    {usagePercent}% من السقف الشهري
                  </span>
                </div>

                {/* Permissions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <Switch
                    checked={member.allowEmergencySOS}
                    onCheckedChange={() => toggleEmergencySos(member.id)}
                  />
                  <div className="text-right">
                    <span className="font-bold text-foreground block">طلب طوارئ SOS فوري:</span>
                    <span className="text-[11px] text-muted-foreground">
                      {member.allowEmergencySOS ? 'مسموح بدون موافقة مسبقة' : 'يتطلب موافقة رب الأسرة'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="text-emerald-600 font-semibold">حساب نشط</span>
                <span>تحديث فوري للرصيد</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 relative shadow-2xl border space-y-4 text-right">
            <h3 className="font-bold text-lg text-foreground">إضافة فرد جديد لمحفظة العائلة</h3>
            <p className="text-xs text-muted-foreground">
              حدد اسم الفرد وصلة القرابة والسقف الشهري الذي يمكنه استخدامه في المنصة:
            </p>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">الاسم الكامل:</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: ياسمين بن علي"
                  className="text-xs text-right rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">صلة القرابة:</Label>
                  <select
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-2 py-2 text-xs text-right"
                  >
                    <option value="الزوجة">الزوجة</option>
                    <option value="الابن">الابن</option>
                    <option value="الابنة">الابنة</option>
                    <option value="الوالد">الوالد</option>
                    <option value="الوالدة">الوالدة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">رقم الهاتف:</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0550 00 00 00"
                    className="text-xs text-right rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">السقف الشهري المحدد (DA):</Label>
                <Input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="text-xs text-right rounded-xl font-mono"
                  min={1000}
                  step={500}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/30">
                <Switch
                  checked={newAllowEmergency}
                  onCheckedChange={setNewAllowEmergency}
                />
                <div className="text-right">
                  <Label className="text-xs font-bold block">السماح بطلب طوارئ SOS للحرفيين:</Label>
                  <span className="text-[10px] text-muted-foreground">عند حدوث تسريب مياه أو انقطاع كهرباء بالمنزل</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground font-bold rounded-xl text-xs"
                >
                  تأكيد الإضافة وتفعيل السقف
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
