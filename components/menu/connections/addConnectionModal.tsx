import { FC, Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { User } from "@/services/types/user";
import { useUser } from "@clerk/nextjs";
import { useConnectionStore } from "@/services/stores/connectionStore";
import { UserConnection } from "@/services/types/connections";
import {
    addConnection,
    acceptConnection,
    unAcceptConnection,
    deleteConnection
} from "@/services/database/connections/actions";

type Props = {
    show: boolean;
    user?: User;
    handleClose: () => void;
};

type ActionsProps = {
    title: string;
    colour: string;
    action: () => void;
};

const ActionsBar: FC<ActionsProps> = ({ title, colour, action }) => {
    const tailwindCSS = `inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-white ring-2 ring-${colour}-500
    hover:bg-${colour}-500 hover:text-white focus:outline-none`;
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center justify-end">
                <button
                    type="button"
                    className={tailwindCSS}
                    onClick={() => {
                        action();
                    }}
                >
                    {`${title}`}
                </button>
            </div>
        </div>
    );
};

export function AddConnectionModal({ show, user, handleClose }: Props) {
    const [userData, setUserData] = useState<User | undefined>(user);
    const [status, setStatus] = useState<string>("Request");
    const [buttonColour, setButtonColour] = useState<string>("blue");
    const { user: currentUser } = useUser();
    const {
        connections,
        addConnectionToStore,
        updateConnectionInStore,
        deleteConnectionInStore
    } = useConnectionStore();
    const isConnection = connections.find(
        (connection: UserConnection) => connection.userId === userData?.uuid
    );
    const handleRequest = async () => {
        const backendRequest = await addConnection(currentUser?.id, user?.uuid);
        console.log(backendRequest);
        if (backendRequest) {
            addConnectionToStore(backendRequest);
            setStatus("Requested");
        }
    };
    const handleAccept = async () => {
        console.log(isConnection?.uuid);
        const backendRequest = await acceptConnection(isConnection.uuid);
        console.log(backendRequest);
        if (backendRequest === 204) {
            updateConnectionInStore(backendRequest);
            setStatus("Connected");
        }
    };
    const handleDisapprove = async () => {
        const backendRequest = await unAcceptConnection(isConnection.uuid);
        console.log(backendRequest);
        if (backendRequest) {
            updateConnectionInStore(backendRequest);
            setStatus("Accept");
        }
    };
    const handleBlock = async () => {
        const backendRequest = await deleteConnection(isConnection.uuid);
        console.log(backendRequest);
        if (backendRequest) {
            deleteConnectionInStore(backendRequest);
            setStatus("Request");
        }
    };

    const handleAction = () => {
        switch (status) {
            case "Request":
                handleRequest();
                break;
            case "Accept":
                handleAccept();
                break;
            case "Requested":
                handleDisapprove();
                break;
            case "Connected":
                handleBlock();
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        if (isConnection?.accepted) {
            setStatus("Connected");
            setButtonColour("blue");
        } else if (
            isConnection?.accepted === false ||
            isConnection?.accepted === null
        ) {
            if (isConnection?.requesterUser === currentUser?.id) {
                setStatus("Requested");
                setButtonColour("gray");
            } else {
                setStatus("Accept");
                setButtonColour("darkblue");
            }
        } else if (!isConnection) {
            setStatus("Request");
            setButtonColour("blue");
        }
    }, [isConnection]);

    useEffect(() => {
        setUserData(user);
    }, [user]);

    return (
        <Transition.Root show={show} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-700"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-start justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-500"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-500"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative w-[90%] transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                <div>
                                    <div
                                        key="close-modal-button"
                                        aria-details="close-modal-button"
                                        className="absolute p-1 m-2 flex right-0 top-0 text-gray-900 hover:bg-blue-500 hover:text-white rounded-lg cursor-pointer"
                                        onClick={handleClose}
                                    >
                                        <ArrowLeftIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex items-center">
                                        <div className="relative h-[50px] w-[50px]">
                                            <Image
                                                className="rounded-full object-cover"
                                                src={
                                                    userData?.profileImageUrl ??
                                                    "/placeholder-author.png"
                                                }
                                                alt="Connection Image"
                                                fill={true}
                                            />
                                        </div>
                                        <Dialog.Title
                                            as="h3"
                                            className="text-base font-semibold leading-6 text-gray-900 ml-4"
                                        >
                                            {userData?.fullName}
                                        </Dialog.Title>
                                    </div>
                                    <div className="flex justify-between mt-4">
                                        <ActionsBar
                                            title={status}
                                            colour={buttonColour}
                                            action={() => handleAction()}
                                        />
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
