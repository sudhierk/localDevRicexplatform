import React from 'react';
import Autosuggest from 'react-autosuggest';
import './FormDataList.css';

export default (props) =>(
  <div className="form-datalist">
    <label className="label" htmlFor="">Company Type*</label>
    <Autosuggest
      theme={{
        container: 'datalist-container',
        containerOpen: 'container--open',
        input: `input ${
          props.validation && props.validation.hasOwnProperty('companyType')
            ? ' input_error input_error--dropdown '
            : ''
          }`,
        suggestionsList: 'list',
        suggestion: 'suggestion',
      }}
      id="companyType"
      name="companyType"
      suggestions={props.suggestions}
      onSuggestionsFetchRequested={props.onSuggestionsFetchRequested}
      onSuggestionsClearRequested={props.onSuggestionsClearRequested}
      getSuggestionValue={(sug)=>sug}
      renderSuggestion={props.renderSuggestion}
      inputProps={props.inputProps}
      focusInputOnSuggestionClick={false}
      highlightFirstSuggestion={true}
      shouldRenderSuggestions={() => true}
    />
  </div>
);