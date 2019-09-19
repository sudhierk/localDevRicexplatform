import React, { Component } from 'react';
import { Document, Page } from 'react-pdf/dist/entry.webpack';
import './PreviewPDF.css';
import MdNavigateBefore from 'react-icons/lib/md/navigate-before';
import MdNavigateNext from 'react-icons/lib/md/navigate-next';

export default class PreviewPDF extends Component {
    state = {
        numPages: null,
        pageNumber: 1
    };

    constructor(props) {
        super(props);
    }

    onDocumentLoadSuccess = ({ numPages }) => {
        this.setState({ numPages });
    };

    get canOpenPreviousPage() {
        return this.state.pageNumber > 1;
    }

    get canOpenNextPage() {
        return this.state.pageNumber < this.state.numPages;
    }

    nextPage = () => {
        if (this.canOpenNextPage) {
            this.setState((prevState) => ({
                pageNumber: prevState.pageNumber + 1
            }));
        }
    };

    previousPage = () => {
        if (this.canOpenPreviousPage) {
            this.setState(prevState => ({
                pageNumber: prevState.pageNumber - 1
            }));
        }
    };

    render() {
        const { pageNumber, numPages } = this.state;

        return (
            <div className="preview-pdf">
                <Document
                    file={this.props.file}
                    onLoadSuccess={this.onDocumentLoadSuccess}
                >
                    <Page pageNumber={pageNumber} width={this.props.width} />
                </Document>
                <div className="preview-pdf__pagination">
                    <button
                        type="button"
                        className="btn btn-link"
                        disabled={!this.canOpenPreviousPage}
                        onClick={this.previousPage}
                    >
                        <MdNavigateBefore />
                    </button>
                    <span>Page {pageNumber} of {numPages}</span>
                    <button
                        type="button"
                        className="btn btn-link"
                        disabled={!this.canOpenNextPage}
                        onClick={this.nextPage}
                    >
                        <MdNavigateNext />
                    </button>
                </div>
            </div>
        );
    }
}
