import { type LucideProps } from 'lucide-react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart2,
  Bell,
  Book,
  BookOpen,
  BookPlus,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Code,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Edit,
  FileText,
  Filter,
  Grid,
  HelpCircle,
  Home,
  Image,
  Laptop,
  LayoutDashboard,
  Link2,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Sliders,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

export type Icon = React.ElementType<LucideProps>;

export const Icons: Record<string, React.ElementType<LucideProps>> = {
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  google: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  ),
  // Add more custom icons as needed
  alertCircle: AlertCircle,
  arrowRight: ArrowRight,
  award: Award,
  barChart: BarChart2,
  bookPlus: BookPlus,
  bell: Bell,
  book: Book,
  bookOpen: BookOpen,
  checkCircle: CheckCircle,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  circle: Circle,
  clock: Clock,
  code: Code,
  copy: Copy,
  creditCard: CreditCard,
  database: Database,
  dollarSign: DollarSign,
  download: Download,
  edit: Edit,
  fileText: FileText,
  filter: Filter,
  grid: Grid,
  helpCircle: HelpCircle,
  home: Home,
  image: Image,
  laptop: Laptop,
  layoutDashboard: LayoutDashboard,
  link: Link2,
  loader: Loader2,
  logIn: LogIn,
  logOut: LogOut,
  mail: Mail,
  menu: Menu,
  messageSquare: MessageSquare,
  moon: Moon,
  moreVertical: MoreVertical,
  plus: Plus,
  search: Search,
  settings: Settings,
  sliders: Sliders,
  sun: Sun,
  trash: Trash2,
  trendingUp: TrendingUp,
  upload: Upload,
  user: User,
  users: Users,
  x: X,
};
