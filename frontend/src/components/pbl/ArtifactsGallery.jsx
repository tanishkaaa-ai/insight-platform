import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';

const ArtifactsGallery = ({ artifacts }) => {
    if (!artifacts || artifacts.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <FileText className="mx-auto text-gray-300 mb-2" size={48} />
                <p className="text-gray-500 font-medium">No artifacts uploaded yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artifacts.map((artifact) => (
                <div key={artifact.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <FileText size={24} />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Download size={16} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                    <h4 className="font-bold text-gray-800 truncate mb-1" title={artifact.title}>{artifact.title}</h4>
                    <p className="text-xs text-gray-500">Uploaded by {artifact.uploaded_by}</p>
                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                        <span className="text-gray-400">{new Date(artifact.uploaded_at).toLocaleDateString()}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase font-bold text-[10px]">{artifact.type}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ArtifactsGallery;
