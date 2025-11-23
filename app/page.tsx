import Link from "next/link";

export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center space-y-8 p-8">
                <h1 className="text-5xl font-bold text-gray-800 mb-12">Family Tree App</h1>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link
                        href="/family-tree"
                        className="group px-8 py-4 bg-blue-600 text-white text-xl font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-xl hover:scale-105"
                    >
                        <span className="flex items-center gap-2">
                            <span>🌳</span>
                            <span>View Family Tree</span>
                        </span>
                    </Link>
                    <Link
                        href="/complete-tree"
                        className="group px-8 py-4 bg-indigo-600 text-white text-xl font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-all duration-200 hover:shadow-xl hover:scale-105"
                    >
                        <span className="flex items-center gap-2">
                            <span>✏️</span>
                            <span>Complete Your Tree</span>
                        </span>
                    </Link>
                </div>
                <p className="text-gray-600 mt-8 max-w-2xl mx-auto">
                    View your interactive family tree or help fill in missing information about your relatives through
                    our guided wizard.
                </p>
            </div>
        </main>
    );
}
