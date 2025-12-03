import { Atom, Braces, FileText } from 'lucide-react';
import { SiJavascript, SiTypescript, SiCsswizardry, SiSass, SiPhp, SiMarkdown, SiHtml5 } from 'react-icons/si';

export const FileName = ({ filePath }: { filePath: string }) => {
    return filePath.split('/').pop();
}

export const FileIcon = ({ filePath }: { filePath: string }) => {
    const extension = filePath.split('.').pop();

    switch (extension) {
        case 'js':
            return <SiJavascript className='size-4' />
        case 'jsx':
            return <Atom className='size-4' />
        case 'ts':
            return <SiTypescript className='size-4' />
        case 'tsx':
            return <Atom className='size-4' />
        case 'json':
            return <Braces className='size-4' />
        case 'css':
            return <SiCsswizardry className='size-4' />
        case 'scss':
            return <SiSass className='size-4' />
        case 'php':
            return <SiPhp className='size-4' />
        case 'md':
            return <SiMarkdown className='size-4' />
        case 'txt':
            return <FileText className='size-4' />
        case 'html':
            return <SiHtml5 className='size-4' />
        default:
            return <FileText className='size-4' />
    }
}