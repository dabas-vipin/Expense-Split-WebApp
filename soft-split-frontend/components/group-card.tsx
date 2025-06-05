import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface GroupCardProps {
  group: {
    id: string
    name: string
    members: Array<{
      id: string
      name: string
      avatar?: string
    }>
  }
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:bg-accent transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              {group.members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="border-2 border-background">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div>
              <h3 className="font-semibold">{group.name}</h3>
              <p className="text-sm text-muted-foreground">
                {group.members.length} members
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

