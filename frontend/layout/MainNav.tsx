import {NavLink} from "react-router-dom";
import {BsBoxArrowUpRight, BsBraces,} from "react-icons/bs";

export default function MainNav() {
    return (
        <div className="h-16 flex items-center justify-between bg-white">
            <div className="h-16 flex items-center gap-6 ">
                <NavLink to="/">
                    <BsBraces
                        className="ml-3 w-[140px] "
                    />
                </NavLink>
                <span className="w-[1px] h-3/4 bg-gray-200"/>
                <div className="inline-block">
                    <ul className="flex md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-normal md:border-0 dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                        <li>
                            <NavLink
                                to="/"
                                className={({isActive}) =>
                                    isActive ? "p-2 text-[#1347FF]  bg-[#EBEFFF]" : "p-2"
                                }
                            >
                                Installed
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/Repository"
                                className={({isActive}) =>
                                    isActive ? "p-2 text-[#1347FF] bg-[#EBEFFF]" : "p-2"
                                }
                            >
                                Repository
                            </NavLink>
                        </li>
                        <li>
                            <a
                                href="https://github.com/komodorio/helm-dashboard/releases"
                                className="text-upgrade-color"
                            >
                                Upgrade to {latestVersion}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="h-16 flex items-center gap-5 ">
                <div className="flex p-1 gap-2 border bottom-gray-200 rounded">
                    <div className="flex flex-col">
                        <a
                            href="https://komodor.com/helm-dash/"
                            className="text-[#0d6efd] font-bold"
                        >
                            <div className="flex items-center gap-2">
                                Upgrade your HELM experience - Free
                                <BsBoxArrowUpRight className="w-[14px] h-[14px]"/>
                            </div>
                        </a>
                        <label className="text-[#707583]">
                            Auth & RBAC, k8s events, troubleshooting and more
                        </label>
                    </div>
                </div>

                <span className="w-[1px] h-3/4 bg-gray-200"/>
            </div>
        </div>
    );
}
