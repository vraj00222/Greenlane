import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account and app preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Profile</CardTitle>
            </div>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Edit Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Manage Notifications</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-base">Privacy & Security</CardTitle>
            </div>
            <CardDescription>Control your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Security Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base">Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Theme Settings</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Connected Services</CardTitle>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
            <CardDescription>Connect with third-party sustainability services</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8 text-muted-foreground">
            Integration with carbon offset providers and sustainability APIs coming in future updates
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
