# AI Usage
Created using Cursor's Auto mode throughout.

## Agent Usage  
> Which tasks were completed with AI assistance? What prompts worked best?  
- `/bmad-agent-pm /bmad-create-prd` passing the required initial spec after discussion.
- `/bmad-agent-ux-designer /bmad-create-ux-design` adding guidence on theme, and the selecting between options.
- `/bmad-agent-architect /bmad-create-architecture` using the criteria along with its recommendations.
- `/bmad-agent-pm /bmad-create-epics-and-stories` reordering to match criteria.
- `/bmad-agent-pm /bmad-check-implementation-readiness`
- `/bmad-agent-sm /bmad-sprint-planning`
- `/bmad-agent-sm /bmad-create-story` with the story ID, running all stories for the current epic in parallel, and epics in series after the previous is dev-done.
- `/bmad-agent-dev /bmad-dev-story` with the story ID to it doesn't spend tokens figuring out which one.
- `/bmad-agent-dev /bmad-code-review` with the story ID.
- Asking it to create a Postman collection, and then to add validation tests.
- `/bmad-generate-project-context` to describe some additional tasks, like keeping the Postman collection updated and reminding me to reimport.
- `/bmad-help` to find out how to add the above context.
- `/bmad-agent-sm /bmad-retrospective` with epic ID.

## MCP Server Usage  
> Which MCP servers did you use? How did they help?  
- Postman to validate the API
- Chrome DevTools to run Lighthouse tests

## Test Generation  
> How did AI assist in generating test cases? What did it miss?  
- Created Postman validation tests
- API integration tests
- E2E tests

## Debugging with AI  
> Document cases where AI helped debug issues.  
- Fixed issues flagged by Lighthouse.

## Limitations Encountered  
> What couldn't the AI do well? Where was human expertise critical?  
- Sometimes didn't mark reviews as done after discussion, when I said I was happy with the outcome, unless explicitly stated.
- It thought there was an error connecting to a new endpoint and suspected that Postman was trying to access an endpoint that wasn't ours, when it was just because it didn't use a hot or manual reload.
- Despite adding some guidence in the context, it did need to be reminded of some tasks I wanted it to do after certain steps, like run some additional tests automatically.
- It the Playwright tests wheren't working and the error was too vague for it to figure out why. I had to tell it to start from scratch and point it to some docs. Still no success, but works locally. Left until later after token allowance resets.
