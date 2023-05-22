import {useLocation} from "react-router-dom";

function Providers() {
    const {state: release} = useLocation();


    return (
        <div className="flex">
            <div className="flex flex-col gap-2 w-1/6 h-screen bg-[#E8EDF2]">
                <label className="mt-5 mx-5 text-sm text-[#3D4048] font-semibold">
                    Providers
                </label>
                list
            </div>

            <div className="w-full h-screen bg-[#F4F7FA]">
                details {release}
            </div>
        </div>
    );
}

export default Providers;
