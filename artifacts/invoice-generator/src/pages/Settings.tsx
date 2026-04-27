import { useState, useEffect } from "react";
import { getProfile, saveProfile, BusinessProfile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Upload, X } from "lucide-react";

export default function Settings() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  if (!profile) return null;

  const handleSave = () => {
    saveProfile(profile);
    toast.success("Profile saved successfully");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfile(prev => prev ? { ...prev, logoDataUrl: event.target?.result as string } : prev);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business profile and default preferences.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>This information will appear on your invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {profile.logoDataUrl ? (
                  <div className="relative border rounded-lg p-2 bg-muted/50">
                    <img src={profile.logoDataUrl} alt="Logo" className="h-16 w-auto object-contain" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => setProfile({ ...profile, logoDataUrl: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 w-full hover:bg-muted/50 transition-colors">
                    <Label htmlFor="logo-upload" className="flex flex-col items-center cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload logo</span>
                    </Label>
                    <Input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input 
                value={profile.name} 
                onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={profile.email} 
                onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                value={profile.phone} 
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea 
                value={profile.address} 
                onChange={(e) => setProfile({ ...profile, address: e.target.value })} 
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Defaults</CardTitle>
            <CardDescription>Pre-fill values for new invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Input 
                  value={profile.defaultCurrency} 
                  onChange={(e) => setProfile({ ...profile, defaultCurrency: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Default Tax Rate (%)</Label>
                <Input 
                  type="number"
                  min="0"
                  step="0.1"
                  value={profile.defaultTaxRate} 
                  onChange={(e) => setProfile({ ...profile, defaultTaxRate: Number(e.target.value) })} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Payment Terms (Days)</Label>
              <Input 
                type="number"
                min="0"
                value={profile.defaultPaymentTermsDays} 
                onChange={(e) => setProfile({ ...profile, defaultPaymentTermsDays: Number(e.target.value) })} 
              />
            </div>

            <div className="space-y-2">
              <Label>Default Notes</Label>
              <Textarea 
                value={profile.defaultNotes} 
                onChange={(e) => setProfile({ ...profile, defaultNotes: e.target.value })} 
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Terms & Conditions</Label>
              <Textarea 
                value={profile.defaultTerms} 
                onChange={(e) => setProfile({ ...profile, defaultTerms: e.target.value })} 
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
