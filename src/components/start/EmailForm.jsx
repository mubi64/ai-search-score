
import React, { useState } from "react";
import apiClient from "@/api/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmailForm({ onDiscovering, onDiscovered }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const extractDomain = (email) => {
    const match = email.match(/@(.+)$/);
    return match ? match[1].toLowerCase() : null;
  };

  const isPersonalEmail = (domain) => {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com',
      'mail.com', 'protonmail.com', 'proton.me', 'yandex.com', 'zoho.com', 'gmx.com',
      'live.com', 'msn.com', 'me.com', 'mac.com', 'inbox.com', 'fastmail.com',
      'hey.com', 'tutanota.com', 'tutamail.com', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.fr',
      'yahoo.de', 'yahoo.com.au', 'yahoo.co.jp', 'yahoo.co.in', 'ymail.com',
      'rocketmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
      'hotmail.es', 'outlook.fr', 'outlook.de', 'outlook.it', 'outlook.es',
      'live.co.uk', 'live.fr', 'live.de', 'live.it', 'live.nl', 'aol.co.uk',
      'aol.fr', 'aol.de', 'aim.com', 'att.net', 'sbcglobal.net', 'bellsouth.net',
      'pacbell.net', 'ameritech.net', 'swbell.net', 'snet.net', 'prodigy.net',
      'verizon.net', 'comcast.net', 'cox.net', 'charter.net', 'earthlink.net',
      'juno.com', 'netzero.net', 'roadrunner.com', 'rr.com', 'twc.com',
      'brighthouse.com', 'centurylink.net', 'windstream.net', 'frontier.com',
      'frontiernet.net', 'q.com', 'excite.com', 'usa.net', 'netscape.net',
      'mindspring.com', 'btinternet.com', 'virginmedia.com', 'sky.com',
      'talktalk.net', 'tiscali.co.uk', 'ntlworld.com', 'orange.fr', 'wanadoo.fr',
      'free.fr', 'laposte.net', 'sfr.fr', 't-online.de', 'web.de', 'gmx.de',
      'freenet.de', 'arcor.de', 'telenet.be', 'skynet.be', 'tele2.nl', 'xs4all.nl',
      'planet.nl', 'hetnet.nl', 'home.nl', 'ziggo.nl', 'kpnmail.nl', 'libero.it',
      'tin.it', 'alice.it', 'tiscali.it', 'bigpond.com', 'bigpond.net.au',
      'optusnet.com.au', 'telstra.com', 'tempmail.com', 'guerrillamail.com',
      'mailinator.com', '10minutemail.com', 'throwaway.email', 'temp-mail.org',
      'maildrop.cc', 'rediffmail.com', 'mail.ru', 'list.ru', 'bk.ru', 'inbox.ru',
      'rambler.ru', '163.com', '126.com', 'qq.com', 'sina.com', 'sohu.com',
      'yeah.net', 'naver.com', 'daum.net', 'hanmail.net', 'gmx.net', 'gmx.at',
      'gmx.ch', 'mail2world.com', 'hushmail.com', 'safe-mail.net', 'runbox.com'
    ];

    return personalDomains.includes(domain);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    const domain = extractDomain(email);
    if (!domain) {
      setError("Could not extract domain from email");
      return;
    }

    if (isPersonalEmail(domain)) {
      setError("Please use a business email address. Personal email providers like Gmail, Yahoo, and Outlook are not supported.");
      return;
    }

    onDiscovering();

    try {
      const result = await apiClient.functions.invoke('discoverCompany', { domain });

      if (result.data.error) {
        setError(result.data.error);
        onDiscovered(null);
        return;
      }

      // Check if THIS EMAIL has submitted before (not just if company exists)
      let isNewUser = true; // Assume new user by default
      try {
        const existingSubmissions = await apiClient.entities.EmailSubmission.filter({
          email: email.toLowerCase()
        });
        if (existingSubmissions.length > 0) {
          isNewUser = false; // This email has submitted before
        }
      } catch (filterError) {
        console.log("Could not check for existing email submissions:", filterError);
        // Default to treating as new user if we can't check, which is 'true' initialized above
      }

      // Check if company exists
      let company; // Declare company here
      try {
        const existingCompanies = await apiClient.entities.Company.filter({ domain });
        if (existingCompanies.length > 0) {
          company = existingCompanies[0];
        }
      } catch (filterError) {
        console.log("Could not check for existing company, will create new one:", filterError);
        // `company` will remain undefined, leading to creation later
      }

      // Create company if it doesn't exist
      if (!company) {
        company = await apiClient.entities.Company.create({
          domain,
          name: result.data.name,
          description: result.data.description,
          products: result.data.products,
          industry: result.data.industry
        });
      }

      // Track email submission
      try {
        await apiClient.entities.EmailSubmission.create({
          email: email.toLowerCase(),
          domain,
          company_id: company.id,
          submission_timestamp: new Date().toISOString()
        });
      } catch (trackError) {
        console.log("Could not track email submission:", trackError);
      }

      // Store in session only
      sessionStorage.setItem('userEmail', email);
      sessionStorage.setItem('companyId', company.id);
      sessionStorage.setItem('companyDomain', domain);
      sessionStorage.setItem('isNewUser', isNewUser.toString());

      onDiscovered(company);
    } catch (err) {
      setError("Failed to discover company. Please try again.");
      console.error(err);
      onDiscovered(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium text-[#344547]">Business Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 h-14 text-lg border-slate-200 focus:border-[#df1d29] focus:ring-[#df1d29] placeholder:text-slate-400"
            required
          />
        </div>
        <p className="text-sm text-slate-500">
          We will never sell, share, or spam your email.
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg bg-[#df1d29] hover:bg-[#c51923] text-white shadow-lg shadow-red-500/30"
      >
        Discover Company
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </form>
  );
}
