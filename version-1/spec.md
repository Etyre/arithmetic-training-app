spec for a flashcard app

- This is a desktop app to run on Mac OS.

  - I’m not opinionated about what languages or technologies to use. Stick to what’s popular and easy to read.

- UX:

  - The basic interface shows a simple horizontal arithmetic problem on a white rectangle, without the answer, and a field for typing the answer.

    - When you type the answer, and press enter, it evaluates if the answer was correct or not.

      - If the answer was incorrect, the border of the flashcard flashes red.

      - If the answer was correct but it took more than the graduation interval to answer, it flashes yellow.

      - If the answer was correct and it took less than the graduation interval to answer, it flashes green.

    - It then switches to the next card, randomly drawing from all the cards that are still in play (all the cards in the practice set that haven’t yet graduated).

      - If a problem is answered incorrectly, that problem/card is shown again somewhere within the next 10 problems. 

    - If you get a specific fact correct in less time than the graduation interval, 3 times in a row (without missing it or getting it slower than that in any intermediate trials), it graduates, and the user don’t see this problem again in this practice session (or for the next hour, unless the user switches the practice set).

      - Graduated cards should reset if the app restarts.

  - If you complete every card in a practice set, there’s a little celebration, and the window displays the time series of that session.

    - Claude can improvise what that celebration should include.

  - Space of problems:

    - The arithmetic problems only go up to the 12s. 

      - The largest addition problem is 12 + 12.

      - The largest multiplication problem is 12 \* 12.

    - All subtraction problems have positive number (or 0) answers. Any that would have negative answers are excluded.

    - All division problems have a whole-number answers. Any that would have had fractional answers are excluded.

  - There’s a sidebar on the left with n icons arranged vertically

    - Practice icon: 

      - Clicking this button returns to the basic flashcard interface.

    - A gear icon for the settings

      - Selecting the practice set

        - A 2 by 2 grid, with the symbols for addition, subtraction, multiplication, division.

        - The user can select or diselect any quadrant for any combination of one to four different kinds of problems. 

          - (At least one of the options is always selected. If you try to diselect that option while all the others are diselected, it will throw a pop up saying that you have to select at least one).

        - This determines the “training set”. 

          - If you’ve selected addition and multiplication, you’ll be served a mix of multiplication facts and addition facts. 

          - If you’ve selected only multiplication, you’ll only be served multiplication facts. 

          - etc.

      - Setting the “graduation interval”

        - This is set to 2 seconds by default, but can be set manually.

    - A trendline icon for user stats.

      - Clicking on this icon brings up the stats page, including a main window and a stats toolbar on the right (next to the side bar)

      - A practice session is a collection of responses that are grouped together for displaying aggregate statistics.

        - A practice session ends when either

          - a) when there’s a gap of more than one hour after a response.

          - b) the practice set is manually changed. 

      - The default graph on the stats page shows the average response time of all practice sessions, over time.

        - The x-axis is the date. 

          - Underneath the Y-axis is a two-sided slider that the user can use to set a window: to zoom in on a subset of the date range.

        - The y-axis is the response time.

          - Each session is represented as a rectangle bounded by the fastest response time of a session and the slowest response time of a session.

          - The average response time of a session is brightly marked.

        - The session markers are color-coded depending on the practice set. 

          - Practice sessions in which the practice set was a single kind of arithmetic problem (only addition, or only subtraction, or only multiplication, or only division) are represented by solid colors.

          - Practice sessions in which the practice set was mixed are represented by diagonal stripes of the relevant colors. 

          - Underneath the graph there’s a legend showing which color is which.

        - There’s a toggle just underneath the slider that reads “exclude wrong answers”. 

          - When this toggle is “on”, the graph only displays response time for correct answers. 

          - When this toggle is set to “off” the graph displays response times for correct answers and incorrect answers.

        - Hovering over a practice session triggers a small window that displays the start and end time of the session, and the practice set of that session.

        - Clicking on a practice session opens up a new graph that shows a time series of all the response times of that 

        - practice session, with the wrong answers colored in red.

      - An alternative stats view: a table of math facts.

        - At the top of the table is a selector for the operation you want to view.

        - The columns of the table:

          - The left most column: all of the arithmetic facts of that operation, in order.

          - Correct answer percentage in \[operation]-only practice sets.

          - Correct answer percentage in mixed practice sets.

          - Average response time in \[operation]-only practice sets.

          - Average response time in mixed practice sets.

        - Mixed practice sets refer to any practice set that include arithmetic problems of more than one operation.

      - The stats tool bar has three icons

        - An icon for returning to the main average response time time series graph.

        - An icon for going to table representation

        - Download all data as a CSV

* Backend:

  - For each response given the app saves the following information (in a database or file):

    - The timestamp that the query was served.

    - The timestamp of the response

    - The query (eg the arithmetic question)

    - The given response

    - The practice set in which this query was displayed

    - From these, can be calculated:

      - Whether that response was correct or incorrect

      - The response time.

* Design desiderata: 

  - I might want to change the algorithm that sets the order for which cards are shown, so I want to architect the app in such a way to make it easy to swap out the algorithm that selects cards.

    - In particular, I might want it so that instead of showing cards randomly it shows cards in rough sequential order, starting with problems that involve low numbers and gradually mixing in problems with higher and higher numbers.

    - We might alternatively want to change the algorithm so that cards that have slower response speeds, either over all time, or across recent sessions, or maybe across all time but with a discount rate, are shown more frequently.

- Card Selection Algorithm Interface:

  - The algorithm is a function/module that:

    - Receives:

      - The full set of cards in the current practice set

      - For each card: its graduation state (streak count, last shown time, graduated or not)

      - The response history (all past responses, with timestamps and correctness)

      - The current session's recent cards (to enforce "show again within 10" rule)

    - Returns:

      - The next card to display

  - The algorithm does handle:

    - Graduation logic

    - The "show again within 10" constraint for wrong answers (enforced by the caller

  - Example algorithms that should be implementable with this interface:

    - Random: pick uniformly from non-graduated cards

    - Sequential difficulty: prioritize cards with smaller operands

    - Weakness-focused: prioritize cards with slower historical response times

\


Milestones: 

1. Core flashcard loop (show problem, accept input, evaluate, next card) 

2. Graduation logic and session tracking 

3. Settings sidebar and practice set selection 

4. Stats page with time series graph 

5. Stats table view and CSV export