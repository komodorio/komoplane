import MainNav from "./layout/MainNav";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import "./index.css";
import Main from "./pages/Main";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
    return (
        <div>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <MainNav/>
                    <Routes>
                        <Route path="/" element={<Main/>}/>
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </div>
    );
}
