'use client';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Heading,
  Link,
  List,
  BlockQuote,
  CodeBlock
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import "./Blog.css"

export default function CKEditorInput({ value, onChange }) {
  return (
    <div className="Ck-Editor">
        <CKEditor
    
      editor={ClassicEditor}
      config={{
        licenseKey: 'GPL', // REQUIRED
        plugins: [
          Essentials,
          Paragraph,
          Bold,
          Italic,
          Heading,
          Link,
          List,
          BlockQuote,
          CodeBlock
        ],
        toolbar: [
          'heading',
          '|',
          'bold',
          'italic',
          'link',
          'bulletedList',
          'numberedList',
          '|',
          'blockQuote',
          'codeBlock',
          '|',
          'undo',
          'redo'
        ]
      }}
    
      data={value || ''}
      onChange={(event, editor) => {
        onChange(editor.getData());
      }}
      
    />
    </div>
  );
}
