interface LoadingStateProps {
    message: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
    return (
        <div className="flex justify-center items-center h-64">
            <div className="text-lg">{message}</div>
        </div>
    );
}
