import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { businessAPI, categoryAPI } from "../../api";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  Building2, MapPin, Phone, Globe, Clock, ChevronRight,
  ChevronLeft, CheckCircle, Tag, DollarSign, Info, Link2
} from "lucide-react";

const DEFAULT_WORKING_HOURS = [
  { day: "Mon", isOpen: true, open: "09:00", close: "18:00" },
  { day: "Tue", isOpen: true, open: "09:00", close: "18:00" },
  { day: "Wed", isOpen: true, open: "09:00", close: "18:00" },
  { day: "Thu", isOpen: true, open: "09:00", close: "18:00" },
  { day: "Fri", isOpen: true, open: "09:00", close: "18:00" },
  { day: "Sat", isOpen: true, open: "10:00", close: "16:00" },
  { day: "Sun", isOpen: false, open: "10:00", close: "14:00" },
];

const STEPS = [
  { id: 1, label: "Basic Info", icon: Building2 },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Hours", icon: Clock },
  { id: 4, label: "Extras", icon: Globe },
];

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourbiz", color: "#E1306C" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourbiz", color: "#1877F2" },
  { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/yourbiz", color: "#1DA1F2" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourbiz", color: "#0A66C2" },
];

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function BusinessSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    tagline: "",
    priceRange: "$$",
    phone: "",
    email: "",
    website: "",
    address: { street: "", city: "", state: "", country: "", zipCode: "" },
    workingHours: DEFAULT_WORKING_HOURS,
    socialLinks: { facebook: "", instagram: "", twitter: "", linkedin: "" },
    tags: "",
  });

  useEffect(() => {
    categoryAPI.getAll()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoadingCats(false));
  }, []);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setAddr = (field, value) =>
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  const setSocial = (field, value) =>
    setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [field]: value } }));
  const setHour = (index, field, value) =>
    setForm((prev) => {
      const wh = [...prev.workingHours];
      wh[index] = { ...wh[index], [field]: value };
      return { ...prev, workingHours: wh };
    });

  const validateStep = () => {
    if (step === 1) {
      if (!form.name.trim()) { toast.error("Business name is required"); return false; }
      if (!form.category) { toast.error("Please select a category"); return false; }
    }
    if (step === 2) {
      if (!form.address.city.trim()) { toast.error("City is required"); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 4)); };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      await businessAPI.create(payload);
      toast.success("Business profile created! Your listing is now live.");
      navigate("/dashboard/business");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create business profile");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl mx-auto mb-4">
            🏢
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Set Up Your Business</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Complete each step to create your business profile</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="relative h-2 bg-gray-200 dark:bg-slate-700 rounded-full mb-6">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    done ? "bg-green-500 text-white shadow-md"
                    : active ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
                    : "bg-white dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700"
                  }`}>
                    {done ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${
                    active ? "text-indigo-600 dark:text-indigo-400" : done ? "text-green-600 dark:text-green-400" : "text-gray-400"
                  }`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-gray-100 dark:border-slate-700 p-8">

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <SectionHeader icon={Building2} title="Basic Information" />
              <Field label="Business Name *">
                <input id="biz-name" type="text" value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Bella Hair Studio" className="input-field" maxLength={150} />
              </Field>
              <Field label="Category *">
                {loadingCats ? (
                  <div className="flex items-center gap-2 py-3">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-gray-400">Loading categories…</span>
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-red-500 py-2">No categories found. Please contact admin.</p>
                ) : (
                  <select id="biz-category" value={form.category}
                    onChange={(e) => set("category", e.target.value)} className="input-field">
                    <option value="">Select a category…</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Tagline" hint="A short, catchy phrase">
                <input id="biz-tagline" type="text" value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="e.g. Where style meets perfection" className="input-field" maxLength={200} />
              </Field>
              <Field label="Description" hint="Tell customers what makes you unique">
                <textarea id="biz-description" rows={4} value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe your services, experience, and what sets you apart…"
                  className="input-field resize-none" maxLength={2000} />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/2000</p>
              </Field>
              <Field label="Tags" hint="Comma-separated keywords for search">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="biz-tags" type="text" value={form.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="haircut, styling, coloring" className="input-field pl-10" />
                </div>
              </Field>
            </div>
          )}

          {/* Step 2: Location & Contact */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionHeader icon={MapPin} title="Location & Contact" />
              <Field label="Street Address">
                <input id="biz-street" type="text" value={form.address.street}
                  onChange={(e) => setAddr("street", e.target.value)}
                  placeholder="123 Main Street" className="input-field" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City *">
                  <input id="biz-city" type="text" value={form.address.city}
                    onChange={(e) => setAddr("city", e.target.value)}
                    placeholder="New York" className="input-field" />
                </Field>
                <Field label="State">
                  <input id="biz-state" type="text" value={form.address.state}
                    onChange={(e) => setAddr("state", e.target.value)}
                    placeholder="NY" className="input-field" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Country">
                  <input id="biz-country" type="text" value={form.address.country}
                    onChange={(e) => setAddr("country", e.target.value)}
                    placeholder="United States" className="input-field" />
                </Field>
                <Field label="ZIP Code">
                  <input id="biz-zip" type="text" value={form.address.zipCode}
                    onChange={(e) => setAddr("zipCode", e.target.value)}
                    placeholder="10001" className="input-field" />
                </Field>
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 pt-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact Details</h4>
                <Field label="Phone Number">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="biz-phone" type="tel" value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567" className="input-field pl-10" />
                  </div>
                </Field>
                <Field label="Business Email">
                  <div className="relative">
                    <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="biz-email" type="email" value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="hello@yourbusiness.com" className="input-field pl-10" />
                  </div>
                </Field>
                <Field label="Website">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="biz-website" type="url" value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://www.yourbusiness.com" className="input-field pl-10" />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* Step 3: Working Hours */}
          {step === 3 && (
            <div className="space-y-4">
              <SectionHeader icon={Clock} title="Working Hours" />
              <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-4">
                Toggle each day on/off and set your open and close times.
              </p>
              <div className="space-y-3">
                {form.workingHours.map((wh, i) => (
                  <div key={wh.day} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                    wh.isOpen
                      ? "bg-indigo-50/60 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800"
                      : "bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700 opacity-60"
                  }`}>
                    <span className="w-10 text-sm font-bold text-gray-700 dark:text-gray-300">{wh.day}</span>
                    <button type="button" onClick={() => setHour(i, "isOpen", !wh.isOpen)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${wh.isOpen ? "bg-indigo-600" : "bg-gray-300 dark:bg-slate-600"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${wh.isOpen ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    {wh.isOpen ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={wh.open} onChange={(e) => setHour(i, "open", e.target.value)}
                          className="input-field text-sm py-1.5 px-3 flex-1" />
                        <span className="text-gray-400 text-sm font-medium">to</span>
                        <input type="time" value={wh.close} onChange={(e) => setHour(i, "close", e.target.value)}
                          className="input-field text-sm py-1.5 px-3 flex-1" />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic flex-1">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Extras */}
          {step === 4 && (
            <div className="space-y-6">
              <SectionHeader icon={DollarSign} title="Price Range & Social Links" />

              <Field label="Price Range">
                <div className="grid grid-cols-4 gap-2 mb-1">
                  {["$", "$$", "$$$", "$$$$"].map((p) => (
                    <button key={p} type="button" onClick={() => set("priceRange", p)}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                        form.priceRange === p
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                          : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300"
                      }`}>{p}</button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">$ Budget · $$ Moderate · $$$ Premium · $$$$ Luxury</p>
              </Field>

              <div className="border-t border-gray-100 dark:border-slate-700 pt-5 space-y-3">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Social Links <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </h4>
                {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key} className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id={`biz-${key}`} type="url" value={form.socialLinks[key]}
                      onChange={(e) => setSocial(key, e.target.value)}
                      placeholder={`${label}: ${placeholder}`}
                      className="input-field pl-10" />
                  </div>
                ))}
              </div>

              {/* Summary Preview */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/50">
                <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-3 text-sm">📋 Summary Preview</h4>
                <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <p><span className="font-medium">Name:</span> {form.name || "—"}</p>
                  <p><span className="font-medium">City:</span> {form.address.city || "—"}</p>
                  <p><span className="font-medium">Phone:</span> {form.phone || "—"}</p>
                  <p><span className="font-medium">Price Range:</span> {form.priceRange}</p>
                  <p><span className="font-medium">Open Days:</span> {form.workingHours.filter((w) => w.isOpen).map((w) => w.day).join(", ")}</p>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-indigo-900/30 rounded-xl p-3">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Your business profile will be created and published immediately. You can update details at any time from your dashboard.</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={back} disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${step === 1 ? "opacity-0 pointer-events-none" : "btn-secondary"}`}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
              {STEPS.map((s) => (
                <div key={s.id} className={`rounded-full transition-all duration-300 ${
                  s.id === step ? "w-6 h-2 bg-indigo-600" : s.id < step ? "w-2 h-2 bg-green-500" : "w-2 h-2 bg-gray-200 dark:bg-slate-600"
                }`} />
              ))}
            </div>

            {step < 4 ? (
              <button type="button" onClick={next} className="btn-primary flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
                {submitting ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? "Creating…" : "Create Profile"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
