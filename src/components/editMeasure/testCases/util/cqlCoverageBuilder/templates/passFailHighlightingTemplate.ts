export const definitionTemplate = `<pre style="tab-size: 2;"
  data-library-name="{{ libraryName }}" data-statement-name="{{ statementName }}">
<code>
{{> clause}}
</code>
</pre>`;

export const clauseTemplate = `{{~#if @root.highlightCoverage~}}
<span{{#if r}} data-ref-id="{{r}}" style="{{highlightCoverage r}}"{{/if}}>
{{~#if value ~}}
{{ concat value }}
{{~/if ~}}
{{~#if s~}}
{{~#each s~}}
{{> clause ~}}
{{~/each ~}}
{{~/if~}}
</span>
{{~else~}}
<span{{#if r}} data-ref-id="{{r}}" style="{{highlightClause r}}"{{/if}}>
{{~#if value ~}}
{{ concat value }}
{{~/if ~}}
{{~#if s~}}
{{~#each s~}}
{{> clause ~}}
{{~/each ~}}
{{~/if~}}
</span>
{{~/if~}}`;

//clause covered pass (green with underline)
export const clauseCoveredStylePass = {
  backgroundColor: "rgb(204, 235, 224)",
  color: "rgb(32, 116, 76)",
  borderBottom: "0.35em solid rgb(32, 116, 76)",
};

// clause covered fail (red with double underline)
export const clauseNotCoveredStyleFail = {
  backgroundColor: "rgb(237, 216, 208)",
  color: "rgb(166, 59, 18)",
  borderBottom: "0.35em double rgb(166, 59, 18)",
};

export const clauseNotApplicableStyle = {
  "background-color": "white",
  color: "black",
};
