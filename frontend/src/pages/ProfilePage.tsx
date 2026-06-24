import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile, useChangePassword } from "@/hooks/use-profile";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, profile, roles, loading } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setEditName(profile?.full_name || "");
    setEditPhone(profile?.phone || "");
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const isOwner = roles.includes("owner");
  const backTo = isOwner ? "/dashboard" : roles.includes("tenant") ? "/my-dashboard" : "/";

  const handleUpdateProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        fullName: editName.trim(),
        phone: editPhone.trim(),
      });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Fill in all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">Update your account details and password</p>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{profile?.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {roles.join(", ")}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="opacity-60" />
                </div>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateProfile.isPending}
                  className="w-full rounded-xl"
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-bold text-foreground">Change Password</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleChangePassword}
                  disabled={changePassword.isPending}
                  className="w-full rounded-xl"
                >
                  {changePassword.isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>

            <Button variant="ghost" onClick={() => navigate(backTo)} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
