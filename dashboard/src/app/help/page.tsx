import { HelpCircle, BookOpen, MessageCircle, ExternalLink, Mail, Github } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const faqs = [
  {
    question: "How is the eco-score calculated?",
    answer: "Our AI analyzes product materials, brand sustainability practices, manufacturing location, and certifications to generate a score from 0-100."
  },
  {
    question: "How do I earn achievements?",
    answer: "Achievements are unlocked by consistent sustainable shopping choices, maintaining streaks, and reaching carbon savings milestones."
  },
  {
    question: "What data do you collect?",
    answer: "We only collect product scan data and your shopping choices to provide personalized sustainability insights. No personal payment data is stored."
  },
  {
    question: "How accurate are the recommendations?",
    answer: "Our AI is trained on extensive sustainability databases and continuously improves. However, always verify claims with official certifications."
  }
]

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
        </div>
        <p className="text-muted-foreground">
          Get help with GreenLane and learn about sustainable shopping
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold mb-1">Documentation</h3>
            <p className="text-sm text-muted-foreground">Learn how to use GreenLane</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <MessageCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="font-semibold mb-1">Community</h3>
            <p className="text-sm text-muted-foreground">Join our Discord server</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
              <Mail className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="font-semibold mb-1">Contact Us</h3>
            <p className="text-sm text-muted-foreground">Get personalized support</p>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Find answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                <h4 className="font-semibold mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>External links and resources</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" className="gap-2">
            <Github className="h-4 w-4" />
            View on GitHub
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button variant="outline" className="gap-2">
            <BookOpen className="h-4 w-4" />
            API Documentation
            <ExternalLink className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
