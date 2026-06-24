import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from './ui/sidebar';
import { House } from 'lucide-react';

const navItems = [
    { to: '/' as const, label: 'Home', icon: House },
];

export default function Layout() {
    const matchRoute = useMatchRoute();

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <h1 className="text-xl font-bold px-2">App Name</h1>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navItems.map((item) => {
                                    const isActive = !!matchRoute({ to: item.to });

                                    return (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton isActive={isActive}>
                                                <div className="flex gap-2">
                                                    <item.icon />
                                                    <Link to={item.to}>
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter />
            </Sidebar>
            <SidebarInset>
                <header className="flex h-12 items-center px-4">
                    <SidebarTrigger />
                </header>
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
